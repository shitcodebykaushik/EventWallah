package httpapi

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (s *Server) launchOperationScope(r *http.Request) (int64, int64, int64, error) {
	adminID, orgID, _, err := s.adminScope(r)
	if err != nil {
		return 0, 0, 0, err
	}
	p, programOrgID, err := s.currentLaunchProgram(r, false)
	if err != nil || programOrgID != orgID {
		return 0, 0, 0, sql.ErrNoRows
	}
	return adminID, orgID, p.ID, nil
}

func queryMaps(rows *sql.Rows, columns []string) []map[string]any {
	if rows == nil {
		return []map[string]any{}
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		values := make([]any, len(columns))
		pointers := make([]any, len(columns))
		for i := range values {
			pointers[i] = &values[i]
		}
		if rows.Scan(pointers...) != nil {
			continue
		}
		item := map[string]any{}
		for i, column := range columns {
			switch value := values[i].(type) {
			case []byte:
				item[column] = string(value)
			default:
				item[column] = value
			}
		}
		items = append(items, item)
	}
	return items
}

func (s *Server) launchOperationsAdmin(w http.ResponseWriter, r *http.Request) {
	_, orgID, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 404, "Launch Bharat programme not found")
		return
	}
	settings := map[string]any{}
	var min, max, capacity, iw, fw, aw, pw int
	var enabled, public bool
	var rules, updated string
	if s.store.DB.QueryRowContext(r.Context(), `SELECT minimum_team_size,maximum_team_size,application_capacity,innovation_weight,feasibility_weight,impact_weight,presentation_weight,applications_enabled,results_public,rules_version,updated_at FROM launch_program_settings WHERE program_id=?`, programID).Scan(&min, &max, &capacity, &iw, &fw, &aw, &pw, &enabled, &public, &rules, &updated) == nil {
		settings = map[string]any{"minimumTeamSize": min, "maximumTeamSize": max, "applicationCapacity": capacity, "innovationWeight": iw, "feasibilityWeight": fw, "impactWeight": aw, "presentationWeight": pw, "applicationsEnabled": enabled, "resultsPublic": public, "rulesVersion": rules, "updatedAt": updated}
	}
	inquiryRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT id,public_id,institution_name,institution_type,city_state,contact_name,contact_email,contact_phone,contact_role,interest,message,status,notes,created_at FROM launch_partnership_inquiries WHERE program_id=? ORDER BY created_at DESC`, programID)
	expertRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT id,public_id,expert_type,full_name,email,phone,organization_name,designation,expertise,status,conflict_declared,notes,created_at FROM launch_experts WHERE program_id=? AND organization_id=? ORDER BY expert_type,full_name`, programID, orgID)
	assignmentRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT a.id,a.expert_id,e.full_name,a.team_id,COALESCE(t.venture_name,''),a.session_id,COALESCE(s.title,''),a.assignment_role,a.status,a.created_at FROM launch_expert_assignments a JOIN launch_experts e ON e.id=a.expert_id LEFT JOIN launch_teams t ON t.id=a.team_id LEFT JOIN launch_sessions s ON s.id=a.session_id WHERE e.program_id=? ORDER BY a.created_at DESC`, programID)
	sessionRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT id,title,session_type,day_number,venue,starts_at,ends_at,capacity,status,notes FROM launch_sessions WHERE program_id=? ORDER BY starts_at,id`, programID)
	slotRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT ps.id,ps.session_id,s.title,ps.team_id,t.public_id,t.venture_name,ps.sequence_number,ps.starts_at,ps.duration_minutes,ps.room,ps.status,ps.result,ps.notes FROM launch_pitch_slots ps JOIN launch_sessions s ON s.id=ps.session_id JOIN launch_teams t ON t.id=ps.team_id WHERE s.program_id=? ORDER BY ps.starts_at,ps.sequence_number`, programID)
	referralRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT r.id,r.public_id,r.team_id,t.public_id,t.venture_name,r.referral_type,r.provider_name,r.contact_name,r.contact_email,r.status,r.next_action,r.next_action_at,r.notes FROM launch_referrals r JOIN launch_teams t ON t.id=r.team_id JOIN launch_programs p ON p.id=t.program_id WHERE p.id=? ORDER BY r.created_at DESC`, programID)
	milestoneRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT m.id,m.team_id,t.public_id,t.venture_name,m.title,m.due_at,m.status,m.evidence_url,m.notes FROM launch_milestones m JOIN launch_teams t ON t.id=m.team_id WHERE t.program_id=? ORDER BY m.due_at,m.id`, programID)
	legalRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT id,slug,title,version,status,effective_at FROM legal_documents WHERE slug LIKE 'launch-bharat-%' ORDER BY slug,version DESC`)
	writeJSON(w, 200, map[string]any{
		"settings":          settings,
		"inquiries":         queryMaps(inquiryRows, []string{"id", "publicId", "institutionName", "institutionType", "cityState", "contactName", "contactEmail", "contactPhone", "contactRole", "interest", "message", "status", "notes", "createdAt"}),
		"experts":           queryMaps(expertRows, []string{"id", "publicId", "expertType", "fullName", "email", "phone", "organizationName", "designation", "expertise", "status", "conflictDeclared", "notes", "createdAt"}),
		"expertAssignments": queryMaps(assignmentRows, []string{"id", "expertId", "expertName", "teamId", "ventureName", "sessionId", "sessionTitle", "assignmentRole", "status", "createdAt"}),
		"sessions":          queryMaps(sessionRows, []string{"id", "title", "sessionType", "dayNumber", "venue", "startsAt", "endsAt", "capacity", "status", "notes"}),
		"pitchSlots":        queryMaps(slotRows, []string{"id", "sessionId", "sessionTitle", "teamId", "applicationId", "ventureName", "sequenceNumber", "startsAt", "durationMinutes", "room", "status", "result", "notes"}),
		"referrals":         queryMaps(referralRows, []string{"id", "publicId", "teamId", "applicationId", "ventureName", "referralType", "providerName", "contactName", "contactEmail", "status", "nextAction", "nextActionAt", "notes"}),
		"milestones":        queryMaps(milestoneRows, []string{"id", "teamId", "applicationId", "ventureName", "title", "dueAt", "status", "evidenceUrl", "notes"}),
		"legalDocuments":    queryMaps(legalRows, []string{"id", "slug", "title", "version", "status", "effectiveAt"}),
	})
}

func (s *Server) launchProgramUpdate(w http.ResponseWriter, r *http.Request) {
	_, orgID, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 404, "programme not found")
		return
	}
	var in struct {
		Edition             string `json:"edition"`
		Tagline             string `json:"tagline"`
		Summary             string `json:"summary"`
		Vision              string `json:"vision"`
		ApplicationsOpenAt  string `json:"applicationsOpenAt"`
		ApplicationsCloseAt string `json:"applicationsCloseAt"`
		Status              string `json:"status"`
		MinimumTeamSize     int    `json:"minimumTeamSize"`
		MaximumTeamSize     int    `json:"maximumTeamSize"`
		ApplicationCapacity int    `json:"applicationCapacity"`
		InnovationWeight    int    `json:"innovationWeight"`
		FeasibilityWeight   int    `json:"feasibilityWeight"`
		ImpactWeight        int    `json:"impactWeight"`
		PresentationWeight  int    `json:"presentationWeight"`
		ApplicationsEnabled bool   `json:"applicationsEnabled"`
		ResultsPublic       bool   `json:"resultsPublic"`
		RulesVersion        string `json:"rulesVersion"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid programme settings")
		return
	}
	allowedStatus := map[string]bool{"draft": true, "published": true, "paused": true, "completed": true, "archived": true}
	openAt, e1 := time.Parse(time.RFC3339, in.ApplicationsOpenAt)
	closeAt, e2 := time.Parse(time.RFC3339, in.ApplicationsCloseAt)
	if len(strings.TrimSpace(in.Edition)) < 2 || len(strings.TrimSpace(in.Summary)) < 20 || !allowedStatus[in.Status] || e1 != nil || e2 != nil || !closeAt.After(openAt) || in.MinimumTeamSize < 1 || in.MaximumTeamSize < in.MinimumTeamSize || in.MaximumTeamSize > 10 || in.ApplicationCapacity < 1 || in.InnovationWeight+in.FeasibilityWeight+in.ImpactWeight+in.PresentationWeight != 100 || strings.TrimSpace(in.RulesVersion) == "" {
		fail(w, 422, "complete the programme dates, capacity and score weights; weights must total 100")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "could not update programme")
		return
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(r.Context(), `UPDATE launch_programs SET edition=?,tagline=?,summary=?,vision=?,applications_open_at=?,applications_close_at=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND organization_id=?`, strings.TrimSpace(in.Edition), strings.TrimSpace(in.Tagline), strings.TrimSpace(in.Summary), strings.TrimSpace(in.Vision), in.ApplicationsOpenAt, in.ApplicationsCloseAt, in.Status, programID, orgID); err != nil {
		fail(w, 500, "could not update programme")
		return
	}
	if _, err = tx.ExecContext(r.Context(), `UPDATE launch_program_settings SET minimum_team_size=?,maximum_team_size=?,application_capacity=?,innovation_weight=?,feasibility_weight=?,impact_weight=?,presentation_weight=?,applications_enabled=?,results_public=?,rules_version=?,updated_at=CURRENT_TIMESTAMP WHERE program_id=?`, in.MinimumTeamSize, in.MaximumTeamSize, in.ApplicationCapacity, in.InnovationWeight, in.FeasibilityWeight, in.ImpactWeight, in.PresentationWeight, in.ApplicationsEnabled, in.ResultsPublic, strings.TrimSpace(in.RulesVersion), programID); err != nil {
		fail(w, 500, "could not update programme rules")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not finish programme update")
		return
	}
	s.audit(r, "launch_bharat.program_updated", "launch_program", programID, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

func (s *Server) launchTeamDetail(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	teamID, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid team id")
		return
	}
	var applicationID, teamName, ventureName, summary, leadEmail, stage, college, problem, created string
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT t.public_id,t.team_name,t.venture_name,t.summary,t.lead_email,t.stage,c.name,COALESCE(ps.title,''),t.created_at FROM launch_teams t JOIN launch_programs p ON p.id=t.program_id JOIN colleges c ON c.id=t.college_id LEFT JOIN launch_problem_statements ps ON ps.id=t.problem_statement_id WHERE t.id=? AND p.organization_id=?`, teamID, orgID).Scan(&applicationID, &teamName, &ventureName, &summary, &leadEmail, &stage, &college, &problem, &created); err != nil {
		fail(w, 404, "team not found")
		return
	}
	members := s.applicantMembers(r, teamID)
	documents := s.applicantDocuments(r, teamID)
	evalRows, _ := s.store.DB.QueryContext(r.Context(), `SELECT e.id,e.round,e.innovation_score,e.feasibility_score,e.impact_score,e.presentation_score,e.notes,e.updated_at,a.name FROM launch_evaluations e JOIN admins a ON a.id=e.admin_id WHERE e.team_id=? ORDER BY e.round,e.updated_at`, teamID)
	evaluations := queryMaps(evalRows, []string{"id", "round", "innovationScore", "feasibilityScore", "impactScore", "presentationScore", "notes", "updatedAt", "reviewerName"})
	review := map[string]any{}
	var student, institution, size, consent, originality, conflict bool
	var decision, reason string
	var reviewer sql.NullInt64
	var reviewed sql.NullString
	if s.store.DB.QueryRowContext(r.Context(), `SELECT student_status_verified,institution_verified,team_size_verified,consent_verified,originality_declared,conflict_flag,decision,decision_reason,reviewer_id,reviewed_at FROM launch_team_reviews WHERE team_id=?`, teamID).Scan(&student, &institution, &size, &consent, &originality, &conflict, &decision, &reason, &reviewer, &reviewed) == nil {
		review = map[string]any{"studentStatusVerified": student, "institutionVerified": institution, "teamSizeVerified": size, "consentVerified": consent, "originalityDeclared": originality, "conflictFlag": conflict, "decision": decision, "decisionReason": reason, "reviewerId": nullableInt(reviewer), "reviewedAt": nullableString(reviewed)}
	}
	writeJSON(w, 200, map[string]any{"team": map[string]any{"id": teamID, "publicId": applicationID, "teamName": teamName, "ventureName": ventureName, "summary": summary, "leadEmail": leadEmail, "stage": stage, "collegeName": college, "problemTitle": problem, "createdAt": created}, "members": members, "documents": documents, "evaluations": evaluations, "review": review, "referrals": s.applicantReferrals(r, teamID), "milestones": s.applicantMilestones(r, teamID), "pitchSlots": s.applicantPitchSlots(r, teamID)})
}

func (s *Server) launchTeamReview(w http.ResponseWriter, r *http.Request) {
	adminID, orgID, _, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	teamID, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid team id")
		return
	}
	var owns int
	if s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams t JOIN launch_programs p ON p.id=t.program_id WHERE t.id=? AND p.organization_id=?`, teamID, orgID).Scan(&owns) != nil || owns == 0 {
		fail(w, 404, "team not found")
		return
	}
	var in struct {
		StudentStatusVerified bool   `json:"studentStatusVerified"`
		InstitutionVerified   bool   `json:"institutionVerified"`
		TeamSizeVerified      bool   `json:"teamSizeVerified"`
		ConsentVerified       bool   `json:"consentVerified"`
		OriginalityDeclared   bool   `json:"originalityDeclared"`
		ConflictFlag          bool   `json:"conflictFlag"`
		Decision              string `json:"decision"`
		DecisionReason        string `json:"decisionReason"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid review")
		return
	}
	allowed := map[string]bool{"pending": true, "eligible": true, "ineligible": true, "needs_information": true}
	if !allowed[in.Decision] || len(in.DecisionReason) > 2000 {
		fail(w, 422, "select a valid eligibility decision")
		return
	}
	_, err = s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_team_reviews(team_id,student_status_verified,institution_verified,team_size_verified,consent_verified,originality_declared,conflict_flag,decision,decision_reason,reviewer_id,reviewed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(team_id) DO UPDATE SET student_status_verified=excluded.student_status_verified,institution_verified=excluded.institution_verified,team_size_verified=excluded.team_size_verified,consent_verified=excluded.consent_verified,originality_declared=excluded.originality_declared,conflict_flag=excluded.conflict_flag,decision=excluded.decision,decision_reason=excluded.decision_reason,reviewer_id=excluded.reviewer_id,reviewed_at=excluded.reviewed_at,updated_at=CURRENT_TIMESTAMP`, teamID, in.StudentStatusVerified, in.InstitutionVerified, in.TeamSizeVerified, in.ConsentVerified, in.OriginalityDeclared, in.ConflictFlag, in.Decision, strings.TrimSpace(in.DecisionReason), adminID, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		fail(w, 500, "could not save eligibility review")
		return
	}
	if in.Decision == "eligible" {
		_, _ = s.store.DB.ExecContext(r.Context(), `UPDATE launch_teams SET stage='eligible',updated_at=CURRENT_TIMESTAMP WHERE id=? AND stage='applied'`, teamID)
	} else if in.Decision == "ineligible" {
		_, _ = s.store.DB.ExecContext(r.Context(), `UPDATE launch_teams SET stage='rejected',updated_at=CURRENT_TIMESTAMP WHERE id=? AND stage IN ('applied','eligible')`, teamID)
	}
	s.audit(r, "launch_bharat.eligibility_reviewed", "launch_team", teamID, `{}`)
	writeJSON(w, 200, map[string]any{"saved": true})
}

func (s *Server) launchAdminDocument(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	s.serveLaunchDocument(w, r, r.PathValue("id"), nil, &orgID)
}

type partnershipUpdateInput struct {
	Status                 string  `json:"status"`
	Phase                  string  `json:"phase"`
	LeadName               string  `json:"leadName"`
	LeadEmail              string  `json:"leadEmail"`
	Notes                  string  `json:"notes"`
	MOUSignedAt            *string `json:"mouSignedAt"`
	MOUReceived            bool    `json:"mouReceived"`
	FacultyLeadConfirmed   bool    `json:"facultyLeadConfirmed"`
	StudentLeadConfirmed   bool    `json:"studentLeadConfirmed"`
	VenueConfirmed         bool    `json:"venueConfirmed"`
	AVConfirmed            bool    `json:"avConfirmed"`
	InternetConfirmed      bool    `json:"internetConfirmed"`
	VolunteersConfirmed    bool    `json:"volunteersConfirmed"`
	CommunicationsApproved bool    `json:"communicationsApproved"`
	TargetTeamCount        int     `json:"targetTeamCount"`
	ProgrammeDate          *string `json:"programmeDate"`
}

func (s *Server) launchPartnershipUpdate(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid partnership id")
		return
	}
	var in partnershipUpdateInput
	if decode(r, &in) != nil {
		fail(w, 400, "invalid partnership update")
		return
	}
	statuses := map[string]bool{"prospect": true, "onboarding": true, "active": true, "completed": true, "declined": true}
	phases := map[string]bool{"college_onboarding": true, "campus_activation": true, "flagship": true, "incubation": true, "alumni": true}
	if !statuses[in.Status] || !phases[in.Phase] || len(strings.TrimSpace(in.LeadName)) < 2 || !strings.Contains(in.LeadEmail, "@") || in.TargetTeamCount < 0 {
		fail(w, 422, "complete the partnership lifecycle fields")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "could not update partnership")
		return
	}
	defer tx.Rollback()
	result, err := tx.ExecContext(r.Context(), `UPDATE launch_college_partnerships SET status=?,phase=?,lead_name=?,lead_email=?,mou_signed_at=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND program_id IN (SELECT id FROM launch_programs WHERE organization_id=?)`, in.Status, in.Phase, strings.TrimSpace(in.LeadName), strings.ToLower(strings.TrimSpace(in.LeadEmail)), in.MOUSignedAt, strings.TrimSpace(in.Notes), id, orgID)
	if err != nil {
		fail(w, 500, "could not update partnership")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "partnership not found")
		return
	}
	_, err = tx.ExecContext(r.Context(), `INSERT INTO launch_partnership_readiness(partnership_id,mou_received,faculty_lead_confirmed,student_lead_confirmed,venue_confirmed,av_confirmed,internet_confirmed,volunteers_confirmed,communications_approved,target_team_count,programme_date) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(partnership_id) DO UPDATE SET mou_received=excluded.mou_received,faculty_lead_confirmed=excluded.faculty_lead_confirmed,student_lead_confirmed=excluded.student_lead_confirmed,venue_confirmed=excluded.venue_confirmed,av_confirmed=excluded.av_confirmed,internet_confirmed=excluded.internet_confirmed,volunteers_confirmed=excluded.volunteers_confirmed,communications_approved=excluded.communications_approved,target_team_count=excluded.target_team_count,programme_date=excluded.programme_date,updated_at=CURRENT_TIMESTAMP`, id, in.MOUReceived, in.FacultyLeadConfirmed, in.StudentLeadConfirmed, in.VenueConfirmed, in.AVConfirmed, in.InternetConfirmed, in.VolunteersConfirmed, in.CommunicationsApproved, in.TargetTeamCount, in.ProgrammeDate)
	if err != nil {
		fail(w, 500, "could not update readiness checklist")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not finish partnership update")
		return
	}
	s.audit(r, "launch_bharat.partnership_updated", "launch_college_partnership", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

func (s *Server) launchPartnershipUpload(w http.ResponseWriter, r *http.Request) {
	adminID, orgID, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid partnership id")
		return
	}
	var owns int
	if s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_college_partnerships cp JOIN launch_programs p ON p.id=cp.program_id WHERE cp.id=? AND p.organization_id=?`, id, orgID).Scan(&owns) != nil || owns == 0 {
		fail(w, 404, "partnership not found")
		return
	}
	s.saveLaunchDocument(w, r, nil, &id, "admin", adminID, programID)
}

func (s *Server) launchInquiryUpdate(w http.ResponseWriter, r *http.Request) {
	adminID, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid inquiry id")
		return
	}
	var in struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid inquiry update")
		return
	}
	allowed := map[string]bool{"new": true, "qualified": true, "meeting_scheduled": true, "proposal": true, "converted": true, "declined": true}
	if !allowed[in.Status] || len(in.Notes) > 2000 {
		fail(w, 422, "select a valid inquiry status")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_partnership_inquiries SET status=?,notes=?,owner_admin_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND program_id=?`, in.Status, strings.TrimSpace(in.Notes), adminID, id, programID)
	if err != nil {
		fail(w, 500, "could not update inquiry")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "inquiry not found")
		return
	}
	s.audit(r, "launch_bharat.inquiry_updated", "launch_partnership_inquiry", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

type expertInput struct {
	ExpertType       string `json:"expertType"`
	FullName         string `json:"fullName"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	OrganizationName string `json:"organizationName"`
	Designation      string `json:"designation"`
	Expertise        string `json:"expertise"`
	Status           string `json:"status"`
	ConflictDeclared bool   `json:"conflictDeclared"`
	Notes            string `json:"notes"`
}

func validExpert(in *expertInput) bool {
	types := map[string]bool{"mentor": true, "judge": true, "speaker": true, "investor": true, "incubator": true, "grant_provider": true}
	statuses := map[string]bool{"prospect": true, "invited": true, "confirmed": true, "declined": true, "completed": true, "inactive": true}
	in.FullName = strings.TrimSpace(in.FullName)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	return types[in.ExpertType] && statuses[in.Status] && len(in.FullName) >= 2 && strings.Contains(in.Email, "@") && len(in.Expertise) <= 1000 && len(in.Notes) <= 2000
}
func (s *Server) launchExpertCreate(w http.ResponseWriter, r *http.Request) {
	_, orgID, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in expertInput
	if decode(r, &in) != nil || !validExpert(&in) {
		fail(w, 422, "complete the expert profile and status")
		return
	}
	ref, err := randomReference("LBX-", 7, 9)
	if err != nil {
		fail(w, 500, "could not secure expert record")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_experts(public_id,program_id,organization_id,expert_type,full_name,email,phone,organization_name,designation,expertise,status,conflict_declared,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, ref, programID, orgID, in.ExpertType, in.FullName, in.Email, strings.TrimSpace(in.Phone), strings.TrimSpace(in.OrganizationName), strings.TrimSpace(in.Designation), strings.TrimSpace(in.Expertise), in.Status, in.ConflictDeclared, strings.TrimSpace(in.Notes))
	if err != nil {
		fail(w, 409, "this expert already exists for the selected role")
		return
	}
	id, _ := result.LastInsertId()
	s.audit(r, "launch_bharat.expert_created", "launch_expert", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id, "publicId": ref})
}
func (s *Server) launchExpertUpdate(w http.ResponseWriter, r *http.Request) {
	_, orgID, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid expert id")
		return
	}
	var in expertInput
	if decode(r, &in) != nil || !validExpert(&in) {
		fail(w, 422, "complete the expert profile and status")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_experts SET expert_type=?,full_name=?,email=?,phone=?,organization_name=?,designation=?,expertise=?,status=?,conflict_declared=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND program_id=? AND organization_id=?`, in.ExpertType, in.FullName, in.Email, strings.TrimSpace(in.Phone), strings.TrimSpace(in.OrganizationName), strings.TrimSpace(in.Designation), strings.TrimSpace(in.Expertise), in.Status, in.ConflictDeclared, strings.TrimSpace(in.Notes), id, programID, orgID)
	if err != nil {
		fail(w, 409, "could not update expert")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "expert not found")
		return
	}
	s.audit(r, "launch_bharat.expert_updated", "launch_expert", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

func (s *Server) launchExpertAssignmentCreate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in struct {
		ExpertID       int64  `json:"expertId"`
		TeamID         *int64 `json:"teamId"`
		SessionID      *int64 `json:"sessionId"`
		AssignmentRole string `json:"assignmentRole"`
		Status         string `json:"status"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid assignment")
		return
	}
	roles := map[string]bool{"mentor": true, "judge": true, "speaker": true, "panelist": true, "investor_reviewer": true, "incubation_contact": true}
	statuses := map[string]bool{"assigned": true, "accepted": true, "completed": true, "declined": true}
	if in.ExpertID < 1 || (in.TeamID == nil && in.SessionID == nil) || !roles[in.AssignmentRole] || !statuses[in.Status] {
		fail(w, 422, "select an expert, team or session, role and status")
		return
	}
	var valid int
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_experts e WHERE e.id=? AND e.program_id=? AND (? IS NULL OR EXISTS(SELECT 1 FROM launch_teams t WHERE t.id=? AND t.program_id=e.program_id)) AND (? IS NULL OR EXISTS(SELECT 1 FROM launch_sessions s WHERE s.id=? AND s.program_id=e.program_id))`, in.ExpertID, programID, in.TeamID, in.TeamID, in.SessionID, in.SessionID).Scan(&valid)
	if valid == 0 {
		fail(w, 422, "expert and assignment target must belong to this programme")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_expert_assignments(expert_id,team_id,session_id,assignment_role,status) VALUES(?,?,?,?,?)`, in.ExpertID, in.TeamID, in.SessionID, in.AssignmentRole, in.Status)
	if err != nil {
		fail(w, 409, "could not create assignment")
		return
	}
	id, _ := result.LastInsertId()
	s.audit(r, "launch_bharat.expert_assigned", "launch_expert_assignment", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}

type sessionInput struct {
	Title       string `json:"title"`
	SessionType string `json:"sessionType"`
	DayNumber   int    `json:"dayNumber"`
	Venue       string `json:"venue"`
	StartsAt    string `json:"startsAt"`
	EndsAt      string `json:"endsAt"`
	Capacity    int    `json:"capacity"`
	Status      string `json:"status"`
	Notes       string `json:"notes"`
}

func validSession(in *sessionInput) bool {
	types := map[string]bool{"registration": true, "briefing": true, "workshop": true, "mentoring": true, "jury_review": true, "keynote": true, "panel": true, "pitch": true, "expo": true, "awards": true, "networking": true, "other": true}
	statuses := map[string]bool{"draft": true, "scheduled": true, "live": true, "completed": true, "cancelled": true}
	start, e1 := time.Parse(time.RFC3339, in.StartsAt)
	end, e2 := time.Parse(time.RFC3339, in.EndsAt)
	return len(strings.TrimSpace(in.Title)) >= 3 && types[in.SessionType] && in.DayNumber >= 1 && in.DayNumber <= 30 && strings.TrimSpace(in.Venue) != "" && e1 == nil && e2 == nil && end.After(start) && in.Capacity >= 0 && statuses[in.Status] && len(in.Notes) <= 2000
}
func (s *Server) launchSessionCreate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in sessionInput
	if decode(r, &in) != nil || !validSession(&in) {
		fail(w, 422, "complete the session schedule and venue")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_sessions(program_id,title,session_type,day_number,venue,starts_at,ends_at,capacity,status,notes) VALUES(?,?,?,?,?,?,?,?,?,?)`, programID, strings.TrimSpace(in.Title), in.SessionType, in.DayNumber, strings.TrimSpace(in.Venue), in.StartsAt, in.EndsAt, in.Capacity, in.Status, strings.TrimSpace(in.Notes))
	if err != nil {
		fail(w, 500, "could not create session")
		return
	}
	id, _ := result.LastInsertId()
	s.audit(r, "launch_bharat.session_created", "launch_session", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) launchSessionUpdate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid session id")
		return
	}
	var in sessionInput
	if decode(r, &in) != nil || !validSession(&in) {
		fail(w, 422, "complete the session schedule and venue")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_sessions SET title=?,session_type=?,day_number=?,venue=?,starts_at=?,ends_at=?,capacity=?,status=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND program_id=?`, strings.TrimSpace(in.Title), in.SessionType, in.DayNumber, strings.TrimSpace(in.Venue), in.StartsAt, in.EndsAt, in.Capacity, in.Status, strings.TrimSpace(in.Notes), id, programID)
	if err != nil {
		fail(w, 500, "could not update session")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "session not found")
		return
	}
	s.audit(r, "launch_bharat.session_updated", "launch_session", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

type pitchSlotInput struct {
	SessionID       int64  `json:"sessionId"`
	TeamID          int64  `json:"teamId"`
	SequenceNumber  int    `json:"sequenceNumber"`
	StartsAt        string `json:"startsAt"`
	DurationMinutes int    `json:"durationMinutes"`
	Room            string `json:"room"`
	Status          string `json:"status"`
	Result          string `json:"result"`
	Notes           string `json:"notes"`
}

func validPitchSlot(in *pitchSlotInput) bool {
	statuses := map[string]bool{"scheduled": true, "checked_in": true, "presenting": true, "completed": true, "no_show": true, "cancelled": true}
	results := map[string]bool{"pending": true, "advanced": true, "not_advanced": true, "winner": true, "runner_up": true}
	_, err := time.Parse(time.RFC3339, in.StartsAt)
	return in.SessionID > 0 && in.TeamID > 0 && in.SequenceNumber > 0 && err == nil && in.DurationMinutes >= 1 && in.DurationMinutes <= 120 && statuses[in.Status] && results[in.Result] && len(in.Notes) <= 2000
}
func (s *Server) launchPitchSlotCreate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in pitchSlotInput
	if decode(r, &in) != nil || !validPitchSlot(&in) {
		fail(w, 422, "complete the pitch allocation")
		return
	}
	var valid int
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_sessions s JOIN launch_teams t ON t.program_id=s.program_id WHERE s.id=? AND t.id=? AND s.program_id=? AND s.session_type IN ('pitch','jury_review')`, in.SessionID, in.TeamID, programID).Scan(&valid)
	if valid == 0 {
		fail(w, 422, "session and team must belong to this programme")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_pitch_slots(session_id,team_id,sequence_number,starts_at,duration_minutes,room,status,result,notes) VALUES(?,?,?,?,?,?,?,?,?)`, in.SessionID, in.TeamID, in.SequenceNumber, in.StartsAt, in.DurationMinutes, strings.TrimSpace(in.Room), in.Status, in.Result, strings.TrimSpace(in.Notes))
	if err != nil {
		fail(w, 409, "this team or sequence is already allocated")
		return
	}
	id, _ := result.LastInsertId()
	s.audit(r, "launch_bharat.pitch_slot_created", "launch_pitch_slot", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) launchPitchSlotUpdate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid pitch slot id")
		return
	}
	var in pitchSlotInput
	if decode(r, &in) != nil || !validPitchSlot(&in) {
		fail(w, 422, "complete the pitch allocation")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_pitch_slots SET session_id=?,team_id=?,sequence_number=?,starts_at=?,duration_minutes=?,room=?,status=?,result=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND session_id IN (SELECT id FROM launch_sessions WHERE program_id=?)`, in.SessionID, in.TeamID, in.SequenceNumber, in.StartsAt, in.DurationMinutes, strings.TrimSpace(in.Room), in.Status, in.Result, strings.TrimSpace(in.Notes), id, programID)
	if err != nil {
		fail(w, 409, "could not update pitch allocation")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "pitch allocation not found")
		return
	}
	s.audit(r, "launch_bharat.pitch_slot_updated", "launch_pitch_slot", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

type referralInput struct {
	TeamID       int64   `json:"teamId"`
	ExpertID     *int64  `json:"expertId"`
	ReferralType string  `json:"referralType"`
	ProviderName string  `json:"providerName"`
	ContactName  string  `json:"contactName"`
	ContactEmail string  `json:"contactEmail"`
	Status       string  `json:"status"`
	NextAction   string  `json:"nextAction"`
	NextActionAt *string `json:"nextActionAt"`
	Notes        string  `json:"notes"`
}

func validReferral(in *referralInput) bool {
	types := map[string]bool{"mentor": true, "incubator": true, "investor": true, "grant": true, "customer": true, "other": true}
	statuses := map[string]bool{"planned": true, "introduced": true, "meeting_scheduled": true, "in_review": true, "accepted": true, "declined": true, "completed": true}
	return in.TeamID > 0 && types[in.ReferralType] && statuses[in.Status] && len(strings.TrimSpace(in.ProviderName)) >= 2 && len(in.Notes) <= 2000
}
func (s *Server) launchReferralCreate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in referralInput
	if decode(r, &in) != nil || !validReferral(&in) {
		fail(w, 422, "complete the referral record")
		return
	}
	var owns int
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE id=? AND program_id=?`, in.TeamID, programID).Scan(&owns)
	if owns == 0 {
		fail(w, 404, "team not found")
		return
	}
	ref, err := randomReference("LBR-", 7, 9)
	if err != nil {
		fail(w, 500, "could not secure referral")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_referrals(public_id,team_id,expert_id,referral_type,provider_name,contact_name,contact_email,status,next_action,next_action_at,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?)`, ref, in.TeamID, in.ExpertID, in.ReferralType, strings.TrimSpace(in.ProviderName), strings.TrimSpace(in.ContactName), strings.ToLower(strings.TrimSpace(in.ContactEmail)), in.Status, strings.TrimSpace(in.NextAction), in.NextActionAt, strings.TrimSpace(in.Notes))
	if err != nil {
		fail(w, 500, "could not create referral")
		return
	}
	id, _ := result.LastInsertId()
	s.audit(r, "launch_bharat.referral_created", "launch_referral", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id, "publicId": ref})
}
func (s *Server) launchReferralUpdate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid referral id")
		return
	}
	var in referralInput
	if decode(r, &in) != nil || !validReferral(&in) {
		fail(w, 422, "complete the referral record")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_referrals SET team_id=?,expert_id=?,referral_type=?,provider_name=?,contact_name=?,contact_email=?,status=?,next_action=?,next_action_at=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND team_id IN (SELECT id FROM launch_teams WHERE program_id=?)`, in.TeamID, in.ExpertID, in.ReferralType, strings.TrimSpace(in.ProviderName), strings.TrimSpace(in.ContactName), strings.ToLower(strings.TrimSpace(in.ContactEmail)), in.Status, strings.TrimSpace(in.NextAction), in.NextActionAt, strings.TrimSpace(in.Notes), id, programID)
	if err != nil {
		fail(w, 500, "could not update referral")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "referral not found")
		return
	}
	s.audit(r, "launch_bharat.referral_updated", "launch_referral", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

type milestoneInput struct {
	TeamID      int64   `json:"teamId"`
	Title       string  `json:"title"`
	DueAt       *string `json:"dueAt"`
	Status      string  `json:"status"`
	EvidenceURL string  `json:"evidenceUrl"`
	Notes       string  `json:"notes"`
}

func validMilestone(in *milestoneInput) bool {
	statuses := map[string]bool{"planned": true, "in_progress": true, "completed": true, "blocked": true, "cancelled": true}
	return in.TeamID > 0 && len(strings.TrimSpace(in.Title)) >= 3 && statuses[in.Status] && validWebURL(in.EvidenceURL) && len(in.Notes) <= 2000
}
func (s *Server) launchMilestoneCreate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in milestoneInput
	if decode(r, &in) != nil || !validMilestone(&in) {
		fail(w, 422, "complete the milestone record")
		return
	}
	var owns int
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE id=? AND program_id=?`, in.TeamID, programID).Scan(&owns)
	if owns == 0 {
		fail(w, 404, "team not found")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_milestones(team_id,title,due_at,status,evidence_url,notes) VALUES(?,?,?,?,?,?)`, in.TeamID, strings.TrimSpace(in.Title), in.DueAt, in.Status, strings.TrimSpace(in.EvidenceURL), strings.TrimSpace(in.Notes))
	if err != nil {
		fail(w, 500, "could not create milestone")
		return
	}
	id, _ := result.LastInsertId()
	s.audit(r, "launch_bharat.milestone_created", "launch_milestone", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) launchMilestoneUpdate(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := parseIDPath(r)
	if err != nil {
		fail(w, 400, "invalid milestone id")
		return
	}
	var in milestoneInput
	if decode(r, &in) != nil || !validMilestone(&in) {
		fail(w, 422, "complete the milestone record")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_milestones SET team_id=?,title=?,due_at=?,status=?,evidence_url=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND team_id IN (SELECT id FROM launch_teams WHERE program_id=?)`, in.TeamID, strings.TrimSpace(in.Title), in.DueAt, in.Status, strings.TrimSpace(in.EvidenceURL), strings.TrimSpace(in.Notes), id, programID)
	if err != nil {
		fail(w, 500, "could not update milestone")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 404, "milestone not found")
		return
	}
	s.audit(r, "launch_bharat.milestone_updated", "launch_milestone", id, `{}`)
	writeJSON(w, 200, map[string]any{"updated": true})
}

func (s *Server) launchReportData(r *http.Request, programID int64) map[string]any {
	counts := map[string]int{}
	for _, stage := range []string{"applied", "eligible", "shortlisted", "finalist", "incubating", "launched", "rejected", "withdrawn"} {
		var count int
		_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE program_id=? AND stage=?`, programID, stage).Scan(&count)
		counts[stage] = count
	}
	var teams, members, colleges, documents, experts, sessions, referrals, completedMilestones int
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE program_id=?`, programID).Scan(&teams)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_team_members m JOIN launch_teams t ON t.id=m.team_id WHERE t.program_id=?`, programID).Scan(&members)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_college_partnerships WHERE program_id=?`, programID).Scan(&colleges)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_documents WHERE program_id=? AND status='accepted'`, programID).Scan(&documents)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_experts WHERE program_id=? AND status IN ('confirmed','completed')`, programID).Scan(&experts)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_sessions WHERE program_id=?`, programID).Scan(&sessions)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_referrals r JOIN launch_teams t ON t.id=r.team_id WHERE t.program_id=?`, programID).Scan(&referrals)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_milestones m JOIN launch_teams t ON t.id=m.team_id WHERE t.program_id=? AND m.status='completed'`, programID).Scan(&completedMilestones)
	return map[string]any{"stageCounts": counts, "totals": map[string]int{"teams": teams, "students": members, "partnerColleges": colleges, "documents": documents, "confirmedExperts": experts, "sessions": sessions, "referrals": referrals, "completedMilestones": completedMilestones}, "generatedAt": time.Now().UTC().Format(time.RFC3339)}
}
func (s *Server) launchReport(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	writeJSON(w, 200, s.launchReportData(r, programID))
}
func (s *Server) launchReportCSV(w http.ResponseWriter, r *http.Request) {
	_, _, programID, err := s.launchOperationScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT t.public_id,t.team_name,t.venture_name,c.name,t.lead_email,t.stage,COUNT(DISTINCT m.id),COALESCE(AVG((e.innovation_score+e.feasibility_score+e.impact_score+e.presentation_score)/4.0),0),t.created_at FROM launch_teams t JOIN colleges c ON c.id=t.college_id LEFT JOIN launch_team_members m ON m.team_id=t.id LEFT JOIN launch_evaluations e ON e.team_id=t.id WHERE t.program_id=? GROUP BY t.id ORDER BY t.created_at`, programID)
	if err != nil {
		fail(w, 500, "could not create report")
		return
	}
	defer rows.Close()
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="launch-bharat-teams.csv"`)
	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"Application ID", "Team", "Venture", "Institution", "Lead email", "Stage", "Members", "Average score", "Applied at"})
	for rows.Next() {
		var id, team, venture, college, email, stage, created string
		var members int
		var avg float64
		if rows.Scan(&id, &team, &venture, &college, &email, &stage, &members, &avg, &created) == nil {
			_ = writer.Write([]string{id, team, venture, college, email, stage, strconv.Itoa(members), fmt.Sprintf("%.2f", avg), created})
		}
	}
	writer.Flush()
}
