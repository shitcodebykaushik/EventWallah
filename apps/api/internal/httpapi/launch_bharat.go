package httpapi

import (
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type launchProgram struct {
	ID                  int64  `json:"id"`
	Slug                string `json:"slug"`
	Name                string `json:"name"`
	Edition             string `json:"edition"`
	Tagline             string `json:"tagline"`
	Summary             string `json:"summary"`
	Vision              string `json:"vision"`
	ApplicationsOpenAt  string `json:"applicationsOpenAt"`
	ApplicationsCloseAt string `json:"applicationsCloseAt"`
	Status              string `json:"status"`
}

type launchProblem struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Brief       string `json:"brief"`
	Category    string `json:"category"`
	SponsorName string `json:"sponsorName"`
	Status      string `json:"status"`
}

type launchMemberInput struct {
	FullName    string `json:"fullName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Course      string `json:"course"`
	YearOfStudy string `json:"yearOfStudy"`
	Role        string `json:"role"`
	IsLead      bool   `json:"isLead"`
}

type launchTeam struct {
	ID                 int64   `json:"id"`
	PublicID           string  `json:"publicId"`
	CollegeID          int64   `json:"collegeId"`
	CollegeName        string  `json:"collegeName"`
	ProblemStatementID *int64  `json:"problemStatementId"`
	ProblemTitle       string  `json:"problemTitle"`
	TeamName           string  `json:"teamName"`
	VentureName        string  `json:"ventureName"`
	Summary            string  `json:"summary"`
	PitchDeckURL       string  `json:"pitchDeckUrl"`
	PrototypeURL       string  `json:"prototypeUrl"`
	LeadEmail          string  `json:"leadEmail"`
	Stage              string  `json:"stage"`
	MemberCount        int     `json:"memberCount"`
	AverageScore       float64 `json:"averageScore"`
	CreatedAt          string  `json:"createdAt"`
}

func (s *Server) currentLaunchProgram(r *http.Request, publishedOnly bool) (launchProgram, int64, error) {
	var p launchProgram
	var orgID int64
	query := `SELECT p.id,p.organization_id,p.slug,p.name,p.edition,p.tagline,p.summary,p.vision,p.applications_open_at,p.applications_close_at,p.status FROM launch_programs p WHERE p.slug='launch-bharat'`
	if publishedOnly {
		query += ` AND p.status='published'`
	}
	err := s.store.DB.QueryRowContext(r.Context(), query).Scan(&p.ID, &orgID, &p.Slug, &p.Name, &p.Edition, &p.Tagline, &p.Summary, &p.Vision, &p.ApplicationsOpenAt, &p.ApplicationsCloseAt, &p.Status)
	return p, orgID, err
}

func (s *Server) launchProblems(r *http.Request, programID int64, public bool) ([]launchProblem, error) {
	query := `SELECT id,title,brief,category,sponsor_name,status FROM launch_problem_statements WHERE program_id=?`
	if public {
		query += ` AND status='open'`
	}
	query += ` ORDER BY category,title`
	rows, err := s.store.DB.QueryContext(r.Context(), query, programID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []launchProblem{}
	for rows.Next() {
		var item launchProblem
		if err := rows.Scan(&item.ID, &item.Title, &item.Brief, &item.Category, &item.SponsorName, &item.Status); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Server) launchBharatPublic(w http.ResponseWriter, r *http.Request) {
	p, _, err := s.currentLaunchProgram(r, true)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "Launch Bharat programme is not currently published")
		return
	}
	if err != nil {
		fail(w, 500, "could not load Launch Bharat")
		return
	}
	problems, err := s.launchProblems(r, p.ID, true)
	if err != nil {
		fail(w, 500, "could not load problem statements")
		return
	}
	var colleges, teams, finalists int
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_college_partnerships WHERE program_id=? AND status IN ('onboarding','active','completed')`, p.ID).Scan(&colleges)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE program_id=? AND stage!='withdrawn'`, p.ID).Scan(&teams)
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE program_id=? AND stage IN ('finalist','incubating','launched')`, p.ID).Scan(&finalists)
	var minimumTeamSize, maximumTeamSize, capacity int
	var enabled bool
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT minimum_team_size,maximum_team_size,application_capacity,applications_enabled FROM launch_program_settings WHERE program_id=?`, p.ID).Scan(&minimumTeamSize, &maximumTeamSize, &capacity, &enabled); err != nil {
		minimumTeamSize, maximumTeamSize, capacity, enabled = 2, 5, 5000, true
	}
	writeJSON(w, 200, map[string]any{"program": p, "problems": problems, "metrics": map[string]int{"partnerColleges": colleges, "teams": teams, "finalists": finalists}, "applicationRules": map[string]any{"minimumTeamSize": minimumTeamSize, "maximumTeamSize": maximumTeamSize, "applicationCapacity": capacity, "applicationsEnabled": enabled}})
}

func validWebURL(value string) bool {
	if value == "" {
		return true
	}
	u, err := url.ParseRequestURI(value)
	return err == nil && (u.Scheme == "https" || u.Scheme == "http") && u.Host != ""
}

func validLaunchMember(member *launchMemberInput) bool {
	member.FullName = strings.TrimSpace(member.FullName)
	member.Email = strings.ToLower(strings.TrimSpace(member.Email))
	member.Phone = strings.TrimSpace(member.Phone)
	member.Course = strings.TrimSpace(member.Course)
	member.YearOfStudy = strings.TrimSpace(member.YearOfStudy)
	if member.Role == "" {
		member.Role = "member"
	}
	return len(member.FullName) >= 2 && strings.Contains(member.Email, "@") && len(member.Phone) >= 10 && member.Course != "" && member.YearOfStudy != "" && (member.Role == "founder" || member.Role == "cofounder" || member.Role == "member")
}

func (s *Server) launchBharatApply(w http.ResponseWriter, r *http.Request) {
	if !s.allowRequest("launch-apply:"+clientIP(r), 10, time.Hour) {
		fail(w, http.StatusTooManyRequests, "too many applications from this network; try again later")
		return
	}
	var in struct {
		CollegeID          int64               `json:"collegeId"`
		ProblemStatementID *int64              `json:"problemStatementId"`
		TeamName           string              `json:"teamName"`
		VentureName        string              `json:"ventureName"`
		Summary            string              `json:"summary"`
		PitchDeckURL       string              `json:"pitchDeckUrl"`
		PrototypeURL       string              `json:"prototypeUrl"`
		Consent            bool                `json:"consent"`
		TermsAccepted      bool                `json:"termsAccepted"`
		PrivacyAccepted    bool                `json:"privacyAccepted"`
		Password           string              `json:"password"`
		Members            []launchMemberInput `json:"members"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid Launch Bharat application")
		return
	}
	in.TeamName = strings.TrimSpace(in.TeamName)
	in.VentureName = strings.TrimSpace(in.VentureName)
	in.Summary = strings.TrimSpace(in.Summary)
	in.PitchDeckURL = strings.TrimSpace(in.PitchDeckURL)
	in.PrototypeURL = strings.TrimSpace(in.PrototypeURL)
	if !in.Consent || !in.TermsAccepted || !in.PrivacyAccepted {
		fail(w, 422, "consent, participation terms and privacy notice must be accepted")
		return
	}
	if len(in.Password) < 10 || len(in.Password) > 72 {
		fail(w, 422, "create a portal password between 10 and 72 characters")
		return
	}
	p, _, err := s.currentLaunchProgram(r, true)
	if err != nil {
		fail(w, 409, "Launch Bharat applications are not available")
		return
	}
	var minimumTeamSize, maximumTeamSize, applicationCapacity, applicationCount int
	var applicationsEnabled bool
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT minimum_team_size,maximum_team_size,application_capacity,applications_enabled FROM launch_program_settings WHERE program_id=?`, p.ID).Scan(&minimumTeamSize, &maximumTeamSize, &applicationCapacity, &applicationsEnabled); err != nil {
		minimumTeamSize, maximumTeamSize, applicationCapacity, applicationsEnabled = 2, 5, 5000, true
	}
	_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE program_id=? AND stage!='withdrawn'`, p.ID).Scan(&applicationCount)
	if !applicationsEnabled || applicationCount >= applicationCapacity {
		fail(w, 409, "Launch Bharat applications are not accepting additional teams")
		return
	}
	if in.CollegeID < 1 || len(in.TeamName) < 2 || len(in.VentureName) < 2 || len(in.Summary) < 40 || len(in.Summary) > 1500 || len(in.Members) < minimumTeamSize || len(in.Members) > maximumTeamSize || !validWebURL(in.PitchDeckURL) || !validWebURL(in.PrototypeURL) {
		fail(w, 422, "provide a college, team of 2–5 students, venture details and valid links")
		return
	}
	leadIndex := -1
	seenEmails := map[string]bool{}
	for index := range in.Members {
		if !validLaunchMember(&in.Members[index]) || seenEmails[in.Members[index].Email] {
			fail(w, 422, "every team member must have unique and complete details")
			return
		}
		seenEmails[in.Members[index].Email] = true
		if in.Members[index].IsLead {
			if leadIndex >= 0 {
				fail(w, 422, "select exactly one team lead")
				return
			}
			leadIndex = index
		}
	}
	if leadIndex < 0 {
		fail(w, 422, "select exactly one team lead")
		return
	}
	now := time.Now()
	openAt, openErr := time.Parse(time.RFC3339, p.ApplicationsOpenAt)
	closeAt, closeErr := time.Parse(time.RFC3339, p.ApplicationsCloseAt)
	if openErr != nil || closeErr != nil || now.Before(openAt) || now.After(closeAt) {
		fail(w, 409, "Launch Bharat applications are closed")
		return
	}
	var collegeExists int
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM colleges WHERE id=?`, in.CollegeID).Scan(&collegeExists); err != nil || collegeExists == 0 {
		fail(w, 422, "selected institution was not found")
		return
	}
	if in.ProblemStatementID != nil {
		var problemExists int
		if err = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_problem_statements WHERE id=? AND program_id=? AND status='open'`, *in.ProblemStatementID, p.ID).Scan(&problemExists); err != nil || problemExists == 0 {
			fail(w, 422, "selected problem statement is not open")
			return
		}
	}
	publicID, err := randomReference("LB-", 8, 10)
	if err != nil {
		fail(w, 500, "could not secure application")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "application service is unavailable")
		return
	}
	defer tx.Rollback()
	var partnershipID sql.NullInt64
	_ = tx.QueryRowContext(r.Context(), `SELECT id FROM launch_college_partnerships WHERE program_id=? AND college_id=? AND status IN ('onboarding','active','completed')`, p.ID, in.CollegeID).Scan(&partnershipID)
	res, err := tx.ExecContext(r.Context(), `INSERT INTO launch_teams(public_id,program_id,partnership_id,college_id,problem_statement_id,team_name,venture_name,summary,pitch_deck_url,prototype_url,lead_email,consent_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, publicID, p.ID, nullableInt(partnershipID), in.CollegeID, in.ProblemStatementID, in.TeamName, in.VentureName, in.Summary, in.PitchDeckURL, in.PrototypeURL, in.Members[leadIndex].Email, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			fail(w, 409, "this team lead already has a Launch Bharat application")
			return
		}
		fail(w, 500, "could not submit application")
		return
	}
	teamID, _ := res.LastInsertId()
	for _, member := range in.Members {
		if _, err = tx.ExecContext(r.Context(), `INSERT INTO launch_team_members(team_id,full_name,email,phone,course,year_of_study,role,is_lead) VALUES(?,?,?,?,?,?,?,?)`, teamID, member.FullName, member.Email, member.Phone, member.Course, member.YearOfStudy, member.Role, member.IsLead); err != nil {
			fail(w, 500, "could not save team members")
			return
		}
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "could not secure applicant account")
		return
	}
	if _, err = tx.ExecContext(r.Context(), `INSERT INTO launch_team_accounts(team_id,password_hash) VALUES(?,?)`, teamID, string(passwordHash)); err != nil {
		fail(w, 500, "could not create applicant account")
		return
	}
	ipHash := requestValueHash(clientIP(r))
	userAgentHash := requestValueHash(r.UserAgent())
	legalRows, legalErr := tx.QueryContext(r.Context(), `SELECT id FROM legal_documents WHERE status='published' AND slug IN ('launch-bharat-participation-terms','launch-bharat-privacy-notice')`)
	if legalErr != nil {
		fail(w, 500, "could not record legal acceptance")
		return
	}
	legalCount := 0
	for legalRows.Next() {
		var legalID int64
		if legalRows.Scan(&legalID) == nil {
			_, err = tx.ExecContext(r.Context(), `INSERT INTO legal_acceptances(team_id,legal_document_id,accepted_by_email,ip_hash,user_agent_hash) VALUES(?,?,?,?,?)`, teamID, legalID, in.Members[leadIndex].Email, ipHash, userAgentHash)
			if err != nil {
				legalRows.Close()
				fail(w, 500, "could not record legal acceptance")
				return
			}
			legalCount++
		}
	}
	legalRows.Close()
	if legalCount != 2 {
		fail(w, 500, "required legal documents are unavailable")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not finish application")
		return
	}
	writeJSON(w, 201, map[string]any{"applicationId": publicID, "status": "applied", "message": "Your Launch Bharat application has been received for eligibility review."})
}

func (s *Server) launchBharatAdmin(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	p, programOrgID, err := s.currentLaunchProgram(r, false)
	if err != nil || programOrgID != orgID {
		fail(w, 404, "Launch Bharat programme not found")
		return
	}
	problems, err := s.launchProblems(r, p.ID, false)
	if err != nil {
		fail(w, 500, "could not load Launch Bharat workspace")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT t.id,t.public_id,t.college_id,c.name,t.problem_statement_id,COALESCE(ps.title,''),t.team_name,t.venture_name,t.summary,t.pitch_deck_url,t.prototype_url,t.lead_email,t.stage,COUNT(DISTINCT m.id),COALESCE(AVG((e.innovation_score+e.feasibility_score+e.impact_score+e.presentation_score)/4.0),0),t.created_at FROM launch_teams t JOIN colleges c ON c.id=t.college_id LEFT JOIN launch_problem_statements ps ON ps.id=t.problem_statement_id LEFT JOIN launch_team_members m ON m.team_id=t.id LEFT JOIN launch_evaluations e ON e.team_id=t.id WHERE t.program_id=? GROUP BY t.id ORDER BY t.created_at DESC`, p.ID)
	if err != nil {
		fail(w, 500, "could not load teams")
		return
	}
	teams := []launchTeam{}
	for rows.Next() {
		var item launchTeam
		if err = rows.Scan(&item.ID, &item.PublicID, &item.CollegeID, &item.CollegeName, &item.ProblemStatementID, &item.ProblemTitle, &item.TeamName, &item.VentureName, &item.Summary, &item.PitchDeckURL, &item.PrototypeURL, &item.LeadEmail, &item.Stage, &item.MemberCount, &item.AverageScore, &item.CreatedAt); err != nil {
			rows.Close()
			fail(w, 500, "could not read teams")
			return
		}
		teams = append(teams, item)
	}
	rows.Close()
	partnershipRows, err := s.store.DB.QueryContext(r.Context(), `SELECT p.id,p.public_id,p.college_id,c.name,p.status,p.phase,p.lead_name,p.lead_email,p.mou_signed_at,p.notes FROM launch_college_partnerships p JOIN colleges c ON c.id=p.college_id WHERE p.program_id=? ORDER BY c.name`, p.ID)
	if err != nil {
		fail(w, 500, "could not load college partnerships")
		return
	}
	partnerships := []map[string]any{}
	for partnershipRows.Next() {
		var id, collegeID int64
		var ref, college, status, phase, leadName, leadEmail, notes string
		var mou sql.NullString
		if partnershipRows.Scan(&id, &ref, &collegeID, &college, &status, &phase, &leadName, &leadEmail, &mou, &notes) == nil {
			partnerships = append(partnerships, map[string]any{"id": id, "publicId": ref, "collegeId": collegeID, "collegeName": college, "status": status, "phase": phase, "leadName": leadName, "leadEmail": leadEmail, "mouSignedAt": nullableString(mou), "notes": notes})
		}
	}
	partnershipRows.Close()
	counts := map[string]int{}
	for _, stage := range []string{"applied", "eligible", "shortlisted", "finalist", "incubating", "launched"} {
		var count int
		_ = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams WHERE program_id=? AND stage=?`, p.ID, stage).Scan(&count)
		counts[stage] = count
	}
	writeJSON(w, 200, map[string]any{"program": p, "teams": teams, "problems": problems, "partnerships": partnerships, "stageCounts": counts})
}

func nullableString(value sql.NullString) any {
	if value.Valid {
		return value.String
	}
	return nil
}

func (s *Server) launchBharatCreatePartnership(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	p, programOrgID, err := s.currentLaunchProgram(r, false)
	if err != nil || programOrgID != orgID {
		fail(w, 404, "Launch Bharat programme not found")
		return
	}
	var in struct {
		CollegeID int64  `json:"collegeId"`
		LeadName  string `json:"leadName"`
		LeadEmail string `json:"leadEmail"`
		Notes     string `json:"notes"`
	}
	if decode(r, &in) != nil || in.CollegeID < 1 || len(strings.TrimSpace(in.LeadName)) < 2 || !strings.Contains(in.LeadEmail, "@") {
		fail(w, 422, "college and institutional lead are required")
		return
	}
	ref, err := randomReference("LBC-", 7, 9)
	if err != nil {
		fail(w, 500, "could not secure partnership")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_college_partnerships(public_id,program_id,college_id,status,phase,lead_name,lead_email,notes) SELECT ?,?,id,'onboarding','college_onboarding',?,?,? FROM colleges WHERE id=?`, ref, p.ID, strings.TrimSpace(in.LeadName), strings.ToLower(strings.TrimSpace(in.LeadEmail)), strings.TrimSpace(in.Notes), in.CollegeID)
	if err != nil {
		fail(w, 422, "institution is already in the programme or is invalid")
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		fail(w, 404, "institution not found")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "launch_bharat.partnership_created", "launch_college_partnership", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id, "publicId": ref})
}

func (s *Server) launchBharatCreateProblem(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	p, programOrgID, err := s.currentLaunchProgram(r, false)
	if err != nil || programOrgID != orgID {
		fail(w, 404, "Launch Bharat programme not found")
		return
	}
	var in struct {
		Title       string `json:"title"`
		Brief       string `json:"brief"`
		Category    string `json:"category"`
		SponsorName string `json:"sponsorName"`
		Status      string `json:"status"`
	}
	if decode(r, &in) != nil || len(strings.TrimSpace(in.Title)) < 4 || len(strings.TrimSpace(in.Brief)) < 30 || strings.TrimSpace(in.Category) == "" {
		fail(w, 422, "title, category and a clear problem brief are required")
		return
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_problem_statements(program_id,title,brief,category,sponsor_name,status) VALUES(?,?,?,?,?,?)`, p.ID, strings.TrimSpace(in.Title), strings.TrimSpace(in.Brief), strings.TrimSpace(in.Category), strings.TrimSpace(in.SponsorName), in.Status)
	if err != nil {
		fail(w, 422, "problem statement already exists or is invalid")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "launch_bharat.problem_created", "launch_problem_statement", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}

func (s *Server) launchBharatUpdateTeamStage(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid team id")
		return
	}
	var in struct {
		Stage string `json:"stage"`
	}
	allowed := map[string]bool{"applied": true, "eligible": true, "shortlisted": true, "finalist": true, "incubating": true, "launched": true, "rejected": true, "withdrawn": true}
	if decode(r, &in) != nil || !allowed[in.Stage] {
		fail(w, 422, "invalid Launch Bharat team stage")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_teams SET stage=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND program_id IN (SELECT id FROM launch_programs WHERE organization_id=?)`, in.Stage, id, orgID)
	if err != nil {
		fail(w, 500, "could not update team stage")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		fail(w, 404, "team not found")
		return
	}
	s.audit(r, "launch_bharat.team_stage_updated", "launch_team", id, `{"stage":"`+in.Stage+`"}`)
	writeJSON(w, 200, map[string]any{"id": id, "stage": in.Stage})
}

func (s *Server) launchBharatEvaluateTeam(w http.ResponseWriter, r *http.Request) {
	adminID, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	teamID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid team id")
		return
	}
	var in struct {
		Round             string `json:"round"`
		InnovationScore   int    `json:"innovationScore"`
		FeasibilityScore  int    `json:"feasibilityScore"`
		ImpactScore       int    `json:"impactScore"`
		PresentationScore int    `json:"presentationScore"`
		Notes             string `json:"notes"`
	}
	if decode(r, &in) != nil || (in.Round != "screening" && in.Round != "campus_pitch" && in.Round != "grand_pitch") || in.InnovationScore < 1 || in.InnovationScore > 10 || in.FeasibilityScore < 1 || in.FeasibilityScore > 10 || in.ImpactScore < 1 || in.ImpactScore > 10 || in.PresentationScore < 1 || in.PresentationScore > 10 {
		fail(w, 422, "round and four scores from 1 to 10 are required")
		return
	}
	var ownsTeam int
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM launch_teams t JOIN launch_programs p ON p.id=t.program_id WHERE t.id=? AND p.organization_id=?`, teamID, orgID).Scan(&ownsTeam); err != nil || ownsTeam == 0 {
		fail(w, 404, "team not found")
		return
	}
	_, err = s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_evaluations(team_id,admin_id,round,innovation_score,feasibility_score,impact_score,presentation_score,notes) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(team_id,admin_id,round) DO UPDATE SET innovation_score=excluded.innovation_score,feasibility_score=excluded.feasibility_score,impact_score=excluded.impact_score,presentation_score=excluded.presentation_score,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`, teamID, adminID, in.Round, in.InnovationScore, in.FeasibilityScore, in.ImpactScore, in.PresentationScore, strings.TrimSpace(in.Notes))
	if err != nil {
		fail(w, 500, "could not save evaluation")
		return
	}
	s.audit(r, "launch_bharat.team_evaluated", "launch_team", teamID, `{}`)
	writeJSON(w, 200, map[string]any{"teamId": teamID, "saved": true})
}
