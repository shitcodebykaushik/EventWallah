package httpapi

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
	"golang.org/x/crypto/bcrypt"
)

type applicantContextKey struct{}

func requestValueHash(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func (s *Server) launchBharatLegal(w http.ResponseWriter, r *http.Request) {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT slug,title,version,body,effective_at FROM legal_documents WHERE status='published' AND slug LIKE 'launch-bharat-%' ORDER BY slug`)
	if err != nil {
		fail(w, 500, "could not load programme legal documents")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var slug, title, version, body, effectiveAt string
		if rows.Scan(&slug, &title, &version, &body, &effectiveAt) == nil {
			items = append(items, map[string]any{"slug": slug, "title": title, "version": version, "body": body, "effectiveAt": effectiveAt})
		}
	}
	writeJSON(w, 200, map[string]any{"items": items})
}

func (s *Server) launchBharatPartnershipInquiry(w http.ResponseWriter, r *http.Request) {
	if !s.allowRequest("launch-partnership:"+clientIP(r), 8, time.Hour) {
		fail(w, http.StatusTooManyRequests, "too many inquiries from this network; try again later")
		return
	}
	var in struct {
		InstitutionName string `json:"institutionName"`
		InstitutionType string `json:"institutionType"`
		CityState       string `json:"cityState"`
		ContactName     string `json:"contactName"`
		ContactEmail    string `json:"contactEmail"`
		ContactPhone    string `json:"contactPhone"`
		ContactRole     string `json:"contactRole"`
		Interest        string `json:"interest"`
		Message         string `json:"message"`
		Consent         bool   `json:"consent"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid partnership inquiry")
		return
	}
	in.InstitutionName = strings.TrimSpace(in.InstitutionName)
	in.CityState = strings.TrimSpace(in.CityState)
	in.ContactName = strings.TrimSpace(in.ContactName)
	in.ContactEmail = strings.ToLower(strings.TrimSpace(in.ContactEmail))
	in.ContactPhone = strings.TrimSpace(in.ContactPhone)
	in.ContactRole = strings.TrimSpace(in.ContactRole)
	in.Interest = strings.TrimSpace(in.Interest)
	in.Message = strings.TrimSpace(in.Message)
	if !in.Consent || len(in.InstitutionName) < 3 || len(in.CityState) < 3 || len(in.ContactName) < 2 || !strings.Contains(in.ContactEmail, "@") || len(in.ContactPhone) < 10 || in.ContactRole == "" || in.Interest == "" || len(in.Message) > 2000 {
		fail(w, 422, "complete the institution and authorized contact details")
		return
	}
	p, _, err := s.currentLaunchProgram(r, false)
	if err != nil {
		fail(w, 409, "Launch Bharat partnership intake is unavailable")
		return
	}
	ref, err := randomReference("LBI-", 8, 10)
	if err != nil {
		fail(w, 500, "could not secure inquiry")
		return
	}
	_, err = s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_partnership_inquiries(public_id,program_id,institution_name,institution_type,city_state,contact_name,contact_email,contact_phone,contact_role,interest,message,consent_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, ref, p.ID, in.InstitutionName, strings.TrimSpace(in.InstitutionType), in.CityState, in.ContactName, in.ContactEmail, in.ContactPhone, in.ContactRole, in.Interest, in.Message, store.Now())
	if err != nil {
		fail(w, 500, "could not save partnership inquiry")
		return
	}
	writeJSON(w, 201, map[string]any{"inquiryId": ref, "status": "new", "message": "The partnership inquiry has been recorded for programme review."})
}

func (s *Server) launchApplicantLogin(w http.ResponseWriter, r *http.Request) {
	if !s.allowRequest("applicant-login:"+clientIP(r), 10, 15*time.Minute) {
		fail(w, http.StatusTooManyRequests, "too many sign-in attempts; try again later")
		return
	}
	var in struct {
		ApplicationID string `json:"applicationId"`
		Email         string `json:"email"`
		Password      string `json:"password"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid sign-in details")
		return
	}
	in.ApplicationID = strings.ToUpper(strings.TrimSpace(in.ApplicationID))
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	var teamID int64
	var hash string
	var attempts int
	var lockedUntil sql.NullString
	err := s.store.DB.QueryRowContext(r.Context(), `SELECT t.id,a.password_hash,a.failed_attempts,a.locked_until FROM launch_teams t JOIN launch_team_accounts a ON a.team_id=t.id WHERE t.public_id=? AND t.lead_email=?`, in.ApplicationID, in.Email).Scan(&teamID, &hash, &attempts, &lockedUntil)
	if err != nil {
		fail(w, 401, "incorrect application reference, lead email or password")
		return
	}
	if lockedUntil.Valid {
		locked, parseErr := time.Parse(time.RFC3339, lockedUntil.String)
		if parseErr == nil && time.Now().Before(locked) {
			fail(w, http.StatusTooManyRequests, "this applicant account is temporarily locked")
			return
		}
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		attempts++
		var lock any
		if attempts >= 5 {
			lock = time.Now().Add(15 * time.Minute).UTC().Format(time.RFC3339)
			attempts = 0
		}
		_, _ = s.store.DB.ExecContext(r.Context(), `UPDATE launch_team_accounts SET failed_attempts=?,locked_until=? WHERE team_id=?`, attempts, lock, teamID)
		fail(w, 401, "incorrect application reference, lead email or password")
		return
	}
	token, err := randomToken(32)
	if err != nil {
		fail(w, 500, "could not create applicant session")
		return
	}
	expires := time.Now().Add(12 * time.Hour).UTC().Format(time.RFC3339)
	_, _ = s.store.DB.ExecContext(r.Context(), `DELETE FROM launch_applicant_sessions WHERE expires_at<=?`, store.Now())
	if _, err = s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_applicant_sessions(team_id,token_hash,expires_at) VALUES(?,?,?)`, teamID, hashToken(token), expires); err != nil {
		fail(w, 500, "could not create applicant session")
		return
	}
	_, _ = s.store.DB.ExecContext(r.Context(), `UPDATE launch_team_accounts SET failed_attempts=0,locked_until=NULL,last_login_at=? WHERE team_id=?`, store.Now(), teamID)
	s.setApplicantSessionCookie(w, token, 12*time.Hour)
	writeJSON(w, 200, map[string]any{"expiresAt": expires, "applicationId": in.ApplicationID})
}

func (s *Server) setApplicantSessionCookie(w http.ResponseWriter, value string, duration time.Duration) {
	maxAge := int(duration.Seconds())
	if value == "" {
		maxAge = -1
	}
	http.SetCookie(w, &http.Cookie{Name: "eventwallah_launch_session", Value: value, Path: "/", HttpOnly: true, Secure: strings.HasPrefix(s.webURL, "https://"), SameSite: http.SameSiteStrictMode, MaxAge: maxAge})
}

func (s *Server) applicantAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := ""
		if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
			token = strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
		} else if cookie, err := r.Cookie("eventwallah_launch_session"); err == nil {
			token = cookie.Value
		}
		if token == "" {
			fail(w, 401, "applicant authentication required")
			return
		}
		var teamID int64
		err := s.store.DB.QueryRowContext(r.Context(), `SELECT team_id FROM launch_applicant_sessions WHERE token_hash=? AND expires_at>?`, hashToken(token), store.Now()).Scan(&teamID)
		if err != nil {
			fail(w, 401, "applicant session expired or invalid")
			return
		}
		ctx := r.Context()
		ctx = contextWithApplicant(ctx, teamID, hashToken(token))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func contextWithApplicant(ctx context.Context, teamID int64, tokenHash string) context.Context {
	return context.WithValue(ctx, applicantContextKey{}, map[string]any{"teamId": teamID, "tokenHash": tokenHash})
}

func applicantIdentity(r *http.Request) (int64, string) {
	identity := r.Context().Value(applicantContextKey{}).(map[string]any)
	return identity["teamId"].(int64), identity["tokenHash"].(string)
}

func (s *Server) launchApplicantLogout(w http.ResponseWriter, r *http.Request) {
	_, tokenHash := applicantIdentity(r)
	_, _ = s.store.DB.ExecContext(r.Context(), `DELETE FROM launch_applicant_sessions WHERE token_hash=?`, tokenHash)
	s.setApplicantSessionCookie(w, "", 0)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) launchApplicantMe(w http.ResponseWriter, r *http.Request) {
	teamID, _ := applicantIdentity(r)
	var team map[string]any
	var publicID, teamName, ventureName, summary, pitchURL, prototypeURL, leadEmail, stage, createdAt, collegeName, problemTitle string
	err := s.store.DB.QueryRowContext(r.Context(), `SELECT t.public_id,t.team_name,t.venture_name,t.summary,t.pitch_deck_url,t.prototype_url,t.lead_email,t.stage,t.created_at,c.name,COALESCE(p.title,'') FROM launch_teams t JOIN colleges c ON c.id=t.college_id LEFT JOIN launch_problem_statements p ON p.id=t.problem_statement_id WHERE t.id=?`, teamID).Scan(&publicID, &teamName, &ventureName, &summary, &pitchURL, &prototypeURL, &leadEmail, &stage, &createdAt, &collegeName, &problemTitle)
	if err != nil {
		fail(w, 404, "application not found")
		return
	}
	team = map[string]any{"id": teamID, "publicId": publicID, "teamName": teamName, "ventureName": ventureName, "summary": summary, "pitchDeckUrl": pitchURL, "prototypeUrl": prototypeURL, "leadEmail": leadEmail, "stage": stage, "createdAt": createdAt, "collegeName": collegeName, "problemTitle": problemTitle}
	members := s.applicantMembers(r, teamID)
	documents := s.applicantDocuments(r, teamID)
	referrals := s.applicantReferrals(r, teamID)
	milestones := s.applicantMilestones(r, teamID)
	pitches := s.applicantPitchSlots(r, teamID)
	writeJSON(w, 200, map[string]any{"team": team, "members": members, "documents": documents, "referrals": referrals, "milestones": milestones, "pitchSlots": pitches, "canEdit": stage == "applied"})
}

func (s *Server) applicantMembers(r *http.Request, teamID int64) []map[string]any {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT id,full_name,email,phone,course,year_of_study,role,is_lead FROM launch_team_members WHERE team_id=? ORDER BY is_lead DESC,id`, teamID)
	if err != nil {
		return []map[string]any{}
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var name, email, phone, course, year, role string
		var lead bool
		if rows.Scan(&id, &name, &email, &phone, &course, &year, &role, &lead) == nil {
			items = append(items, map[string]any{"id": id, "fullName": name, "email": email, "phone": phone, "course": course, "yearOfStudy": year, "role": role, "isLead": lead})
		}
	}
	return items
}

func (s *Server) applicantDocuments(r *http.Request, teamID int64) []map[string]any {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT public_id,document_type,original_name,mime_type,size_bytes,status,created_at FROM launch_documents WHERE team_id=? AND status!='deleted' ORDER BY created_at DESC`, teamID)
	if err != nil {
		return []map[string]any{}
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id, kind, name, mime, status, created string
		var size int64
		if rows.Scan(&id, &kind, &name, &mime, &size, &status, &created) == nil {
			items = append(items, map[string]any{"id": id, "documentType": kind, "originalName": name, "mimeType": mime, "sizeBytes": size, "status": status, "createdAt": created})
		}
	}
	return items
}

func (s *Server) applicantReferrals(r *http.Request, teamID int64) []map[string]any {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT public_id,referral_type,provider_name,status,next_action,next_action_at,notes FROM launch_referrals WHERE team_id=? ORDER BY created_at DESC`, teamID)
	if err != nil {
		return []map[string]any{}
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id, kind, provider, status, action, notes string
		var at sql.NullString
		if rows.Scan(&id, &kind, &provider, &status, &action, &at, &notes) == nil {
			items = append(items, map[string]any{"id": id, "referralType": kind, "providerName": provider, "status": status, "nextAction": action, "nextActionAt": nullableString(at), "notes": notes})
		}
	}
	return items
}

func (s *Server) applicantMilestones(r *http.Request, teamID int64) []map[string]any {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT id,title,due_at,status,evidence_url,notes FROM launch_milestones WHERE team_id=? ORDER BY due_at,id`, teamID)
	if err != nil {
		return []map[string]any{}
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var title, status, evidence, notes string
		var due sql.NullString
		if rows.Scan(&id, &title, &due, &status, &evidence, &notes) == nil {
			items = append(items, map[string]any{"id": id, "title": title, "dueAt": nullableString(due), "status": status, "evidenceUrl": evidence, "notes": notes})
		}
	}
	return items
}

func (s *Server) applicantPitchSlots(r *http.Request, teamID int64) []map[string]any {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT ps.id,s.title,ps.sequence_number,ps.starts_at,ps.duration_minutes,ps.room,ps.status,ps.result FROM launch_pitch_slots ps JOIN launch_sessions s ON s.id=ps.session_id WHERE ps.team_id=? ORDER BY ps.starts_at`, teamID)
	if err != nil {
		return []map[string]any{}
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var session, starts, room, status, result string
		var seq, duration int
		if rows.Scan(&id, &session, &seq, &starts, &duration, &room, &status, &result) == nil {
			items = append(items, map[string]any{"id": id, "sessionTitle": session, "sequenceNumber": seq, "startsAt": starts, "durationMinutes": duration, "room": room, "status": status, "result": result})
		}
	}
	return items
}

func (s *Server) launchApplicantUpdate(w http.ResponseWriter, r *http.Request) {
	teamID, _ := applicantIdentity(r)
	var currentStage string
	if err := s.store.DB.QueryRowContext(r.Context(), `SELECT stage FROM launch_teams WHERE id=?`, teamID).Scan(&currentStage); err != nil || currentStage != "applied" {
		fail(w, 409, "only applications awaiting review can be edited")
		return
	}
	var in struct {
		TeamName     string              `json:"teamName"`
		VentureName  string              `json:"ventureName"`
		Summary      string              `json:"summary"`
		PitchDeckURL string              `json:"pitchDeckUrl"`
		PrototypeURL string              `json:"prototypeUrl"`
		Members      []launchMemberInput `json:"members"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid application update")
		return
	}
	in.TeamName = strings.TrimSpace(in.TeamName)
	in.VentureName = strings.TrimSpace(in.VentureName)
	in.Summary = strings.TrimSpace(in.Summary)
	in.PitchDeckURL = strings.TrimSpace(in.PitchDeckURL)
	in.PrototypeURL = strings.TrimSpace(in.PrototypeURL)
	if len(in.TeamName) < 2 || len(in.VentureName) < 2 || len(in.Summary) < 40 || len(in.Summary) > 1500 || len(in.Members) < 2 || len(in.Members) > 5 || !validWebURL(in.PitchDeckURL) || !validWebURL(in.PrototypeURL) {
		fail(w, 422, "provide complete venture and team details")
		return
	}
	leadIndex := -1
	seen := map[string]bool{}
	for i := range in.Members {
		if !validLaunchMember(&in.Members[i]) || seen[in.Members[i].Email] {
			fail(w, 422, "every member must have unique and complete details")
			return
		}
		seen[in.Members[i].Email] = true
		if in.Members[i].IsLead {
			if leadIndex >= 0 {
				fail(w, 422, "select exactly one team lead")
				return
			}
			leadIndex = i
		}
	}
	if leadIndex < 0 {
		fail(w, 422, "select exactly one team lead")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "could not update application")
		return
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(r.Context(), `UPDATE launch_teams SET team_name=?,venture_name=?,summary=?,pitch_deck_url=?,prototype_url=?,lead_email=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND stage='applied'`, in.TeamName, in.VentureName, in.Summary, in.PitchDeckURL, in.PrototypeURL, in.Members[leadIndex].Email, teamID); err != nil {
		fail(w, 409, "lead email is already used by another application")
		return
	}
	if _, err = tx.ExecContext(r.Context(), `DELETE FROM launch_team_members WHERE team_id=?`, teamID); err != nil {
		fail(w, 500, "could not update members")
		return
	}
	for _, member := range in.Members {
		if _, err = tx.ExecContext(r.Context(), `INSERT INTO launch_team_members(team_id,full_name,email,phone,course,year_of_study,role,is_lead) VALUES(?,?,?,?,?,?,?,?)`, teamID, member.FullName, member.Email, member.Phone, member.Course, member.YearOfStudy, member.Role, member.IsLead); err != nil {
			fail(w, 500, "could not update members")
			return
		}
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not finish application update")
		return
	}
	writeJSON(w, 200, map[string]any{"updated": true})
}

func (s *Server) launchApplicantPassword(w http.ResponseWriter, r *http.Request) {
	teamID, _ := applicantIdentity(r)
	var in struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if decode(r, &in) != nil || len(in.NewPassword) < 10 || len(in.NewPassword) > 72 {
		fail(w, 422, "provide the current password and a new password between 10 and 72 characters")
		return
	}
	var hash string
	if err := s.store.DB.QueryRowContext(r.Context(), `SELECT password_hash FROM launch_team_accounts WHERE team_id=?`, teamID).Scan(&hash); err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.CurrentPassword)) != nil {
		fail(w, 401, "current password is incorrect")
		return
	}
	newHash, err := bcrypt.GenerateFromPassword([]byte(in.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "could not secure password")
		return
	}
	_, err = s.store.DB.ExecContext(r.Context(), `UPDATE launch_team_accounts SET password_hash=?,password_changed_at=?,failed_attempts=0,locked_until=NULL WHERE team_id=?`, string(newHash), store.Now(), teamID)
	if err != nil {
		fail(w, 500, "could not update password")
		return
	}
	_, _ = s.store.DB.ExecContext(r.Context(), `DELETE FROM launch_applicant_sessions WHERE team_id=? AND token_hash!=?`, teamID, applicantTokenHash(r))
	writeJSON(w, 200, map[string]any{"updated": true})
}

func (s *Server) launchApplicantWithdraw(w http.ResponseWriter, r *http.Request) {
	teamID, _ := applicantIdentity(r)
	var in struct {
		Confirmation string `json:"confirmation"`
	}
	if decode(r, &in) != nil || strings.ToUpper(strings.TrimSpace(in.Confirmation)) != "WITHDRAW" {
		fail(w, 422, "type WITHDRAW to confirm application withdrawal")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), `UPDATE launch_teams SET stage='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE id=? AND stage IN ('applied','eligible','shortlisted')`, teamID)
	if err != nil {
		fail(w, 500, "could not withdraw application")
		return
	}
	changed, _ := result.RowsAffected()
	if changed == 0 {
		fail(w, 409, "this application can no longer be withdrawn online")
		return
	}
	_, _ = s.store.DB.ExecContext(r.Context(), `DELETE FROM launch_applicant_sessions WHERE team_id=?`, teamID)
	s.setApplicantSessionCookie(w, "", 0)
	writeJSON(w, 200, map[string]any{"withdrawn": true})
}

func applicantTokenHash(r *http.Request) string { _, hash := applicantIdentity(r); return hash }

const maxLaunchDocumentSize int64 = 8 << 20

func allowedLaunchDocument(data []byte, requestedType string) (string, bool) {
	mime := http.DetectContentType(data)
	allowed := map[string]bool{"application/pdf": true, "image/png": true, "image/jpeg": true, "text/plain; charset=utf-8": true}
	if !allowed[mime] {
		return mime, false
	}
	if (requestedType == "pitch_deck" || requestedType == "mou" || requestedType == "institution_letter" || requestedType == "student_proof") && mime != "application/pdf" {
		return mime, false
	}
	return mime, true
}

func (s *Server) saveLaunchDocument(w http.ResponseWriter, r *http.Request, teamID, partnershipID *int64, uploaderType string, uploaderID int64, programID int64) {
	r.Body = http.MaxBytesReader(w, r.Body, maxLaunchDocumentSize+(1<<20))
	if err := r.ParseMultipartForm(maxLaunchDocumentSize); err != nil {
		fail(w, 413, "document exceeds the 8 MB upload limit")
		return
	}
	kind := strings.TrimSpace(r.FormValue("documentType"))
	allowedKinds := map[string]bool{"pitch_deck": true, "prototype": true, "identity": true, "student_proof": true, "mou": true, "institution_letter": true, "evaluation_evidence": true, "incubation_evidence": true, "other": true}
	if !allowedKinds[kind] {
		fail(w, 422, "invalid document type")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		fail(w, 422, "select a document to upload")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, maxLaunchDocumentSize+1))
	if err != nil || int64(len(data)) == 0 || int64(len(data)) > maxLaunchDocumentSize {
		fail(w, 413, "document exceeds the 8 MB upload limit")
		return
	}
	mime, ok := allowedLaunchDocument(data, kind)
	if !ok {
		fail(w, 422, "only PDF, PNG, JPEG and plain-text files are accepted; official records must be PDF")
		return
	}
	ref, err := randomReference("LBD-", 8, 10)
	if err != nil {
		fail(w, 500, "could not secure document")
		return
	}
	storedToken, err := randomToken(24)
	if err != nil {
		fail(w, 500, "could not secure document")
		return
	}
	storedName := storedToken + ".bin"
	uploadDir := filepath.Join(s.store.DataDir, "uploads", "launch-bharat")
	if err = os.MkdirAll(uploadDir, 0700); err != nil {
		fail(w, 500, "document storage is unavailable")
		return
	}
	fullPath := filepath.Join(uploadDir, storedName)
	if err = os.WriteFile(fullPath, data, 0600); err != nil {
		fail(w, 500, "could not store document")
		return
	}
	checksum := sha256.Sum256(data)
	_, err = s.store.DB.ExecContext(r.Context(), `INSERT INTO launch_documents(public_id,program_id,team_id,partnership_id,document_type,original_name,stored_name,mime_type,size_bytes,checksum_sha256,uploaded_by_type,uploaded_by_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, ref, programID, teamID, partnershipID, kind, filepath.Base(header.Filename), storedName, mime, len(data), hex.EncodeToString(checksum[:]), uploaderType, uploaderID)
	if err != nil {
		_ = os.Remove(fullPath)
		fail(w, 500, "could not record document")
		return
	}
	writeJSON(w, 201, map[string]any{"id": ref, "documentType": kind, "originalName": filepath.Base(header.Filename), "mimeType": mime, "sizeBytes": len(data)})
}

func (s *Server) launchApplicantUpload(w http.ResponseWriter, r *http.Request) {
	teamID, _ := applicantIdentity(r)
	var programID int64
	if err := s.store.DB.QueryRowContext(r.Context(), `SELECT program_id FROM launch_teams WHERE id=? AND stage!='withdrawn'`, teamID).Scan(&programID); err != nil {
		fail(w, 404, "active application not found")
		return
	}
	s.saveLaunchDocument(w, r, &teamID, nil, "applicant", teamID, programID)
}

func (s *Server) serveLaunchDocument(w http.ResponseWriter, r *http.Request, publicID string, teamID *int64, orgID *int64) {
	var stored, name, mime, status string
	var owns int
	query := `SELECT d.stored_name,d.original_name,d.mime_type,d.status,COUNT(*) FROM launch_documents d JOIN launch_programs p ON p.id=d.program_id WHERE d.public_id=?`
	args := []any{publicID}
	if teamID != nil {
		query += ` AND d.team_id=?`
		args = append(args, *teamID)
	}
	if orgID != nil {
		query += ` AND p.organization_id=?`
		args = append(args, *orgID)
	}
	query += ` GROUP BY d.id`
	if err := s.store.DB.QueryRowContext(r.Context(), query, args...).Scan(&stored, &name, &mime, &status, &owns); err != nil || owns == 0 || status != "accepted" {
		fail(w, 404, "document not found")
		return
	}
	data, err := os.ReadFile(filepath.Join(s.store.DataDir, "uploads", "launch-bharat", stored))
	if err != nil {
		fail(w, 404, "document file is unavailable")
		return
	}
	w.Header().Set("Content-Type", mime)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", strings.ReplaceAll(filepath.Base(name), `"`, "")))
	w.Header().Set("Cache-Control", "private, no-store")
	w.WriteHeader(200)
	_, _ = w.Write(data)
}

func (s *Server) launchApplicantDocument(w http.ResponseWriter, r *http.Request) {
	teamID, _ := applicantIdentity(r)
	s.serveLaunchDocument(w, r, r.PathValue("id"), &teamID, nil)
}

func parseIDPath(r *http.Request) (int64, error) { return strconv.ParseInt(r.PathValue("id"), 10, 64) }
