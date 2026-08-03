package httpapi

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
	qrcode "github.com/skip2/go-qrcode"
	"golang.org/x/crypto/bcrypt"
)

type Server struct {
	store         *store.Store
	webURL        string
	allowedOrigin string
	logger        *slog.Logger
	limitMu       sync.Mutex
	limits        map[string]requestLimit
	securityKey   [32]byte
}

type requestLimit struct {
	count   int
	resetAt time.Time
}

type College struct {
	ID              int64  `json:"id"`
	Slug            string `json:"slug"`
	Name            string `json:"name"`
	ShortName       string `json:"shortName"`
	InstitutionType string `json:"institutionType"`
	Ownership       string `json:"ownership"`
	City            string `json:"city"`
	State           string `json:"state"`
	Website         string `json:"website"`
	LogoURL         string `json:"logoUrl"`
	EventCount      int    `json:"eventCount"`
}
type Event struct {
	ID                   int64  `json:"id"`
	CollegeID            int64  `json:"collegeId"`
	CollegeSlug          string `json:"collegeSlug"`
	CollegeName          string `json:"collegeName"`
	CollegeCity          string `json:"collegeCity"`
	Slug                 string `json:"slug"`
	Title                string `json:"title"`
	Category             string `json:"category"`
	Summary              string `json:"summary"`
	Description          string `json:"description"`
	Venue                string `json:"venue"`
	StartsAt             string `json:"startsAt"`
	EndsAt               string `json:"endsAt"`
	RegistrationDeadline string `json:"registrationDeadline"`
	Capacity             int    `json:"capacity"`
	Status               string `json:"status"`
	BannerURL            string `json:"bannerUrl"`
	OrganizerName        string `json:"organizerName"`
	ContactEmail         string `json:"contactEmail"`
	RegistrationCount    int    `json:"registrationCount"`
}
type Registration struct {
	ID          int64   `json:"id"`
	PublicID    string  `json:"publicId"`
	EventID     int64   `json:"eventId"`
	EventSlug   string  `json:"eventSlug,omitempty"`
	EventTitle  string  `json:"eventTitle,omitempty"`
	FullName    string  `json:"fullName"`
	Email       string  `json:"email"`
	Phone       string  `json:"phone"`
	CollegeName string  `json:"collegeName"`
	Course      string  `json:"course"`
	YearOfStudy string  `json:"yearOfStudy"`
	PassToken   string  `json:"passToken,omitempty"`
	Status      string  `json:"status"`
	CheckedInAt *string `json:"checkedInAt"`
	CreatedAt   string  `json:"createdAt"`
	QRURL       string  `json:"qrUrl,omitempty"`
	PassURL     string  `json:"passUrl,omitempty"`
}
type adminContextKey struct{}

func New(st *store.Store, webURL, allowedOrigin string, logger *slog.Logger, securityKeys ...string) http.Handler {
	keyMaterial := "eventwallah-development-security-key"
	if len(securityKeys) > 0 && strings.TrimSpace(securityKeys[0]) != "" {
		keyMaterial = securityKeys[0]
	}
	s := &Server{store: st, webURL: strings.TrimRight(webURL, "/"), allowedOrigin: allowedOrigin, logger: logger, limits: map[string]requestLimit{}, securityKey: sha256.Sum256([]byte(keyMaterial))}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.health)
	mux.HandleFunc("GET /api/v1/colleges", s.listColleges)
	mux.HandleFunc("GET /api/v1/colleges/{slug}", s.getCollege)
	mux.HandleFunc("GET /api/v1/colleges/{slug}/events", s.collegeEvents)
	mux.HandleFunc("GET /api/v1/events", s.listEvents)
	mux.HandleFunc("GET /api/v1/events/{slug}", s.getEvent)
	mux.HandleFunc("GET /api/v1/events/{slug}/tickets", s.publicTickets)
	mux.HandleFunc("POST /api/v1/events/{slug}/orders", s.createOrder)
	mux.HandleFunc("GET /api/v1/passes/{token}", s.getPass)
	mux.HandleFunc("GET /api/v1/passes/{token}/qr", s.passQR)
	mux.HandleFunc("GET /api/v1/launch-bharat", s.launchBharatPublic)
	mux.HandleFunc("GET /api/v1/launch-bharat/legal", s.launchBharatLegal)
	mux.HandleFunc("POST /api/v1/launch-bharat/applications", s.launchBharatApply)
	mux.HandleFunc("POST /api/v1/launch-bharat/partnership-inquiries", s.launchBharatPartnershipInquiry)
	mux.HandleFunc("POST /api/v1/launch-bharat/applicant/login", s.launchApplicantLogin)
	mux.Handle("POST /api/v1/launch-bharat/applicant/logout", s.applicantAuth(http.HandlerFunc(s.launchApplicantLogout)))
	mux.Handle("GET /api/v1/launch-bharat/applicant/me", s.applicantAuth(http.HandlerFunc(s.launchApplicantMe)))
	mux.Handle("PUT /api/v1/launch-bharat/applicant/application", s.applicantAuth(http.HandlerFunc(s.launchApplicantUpdate)))
	mux.Handle("POST /api/v1/launch-bharat/applicant/withdraw", s.applicantAuth(http.HandlerFunc(s.launchApplicantWithdraw)))
	mux.Handle("PUT /api/v1/launch-bharat/applicant/password", s.applicantAuth(http.HandlerFunc(s.launchApplicantPassword)))
	mux.Handle("POST /api/v1/launch-bharat/applicant/documents", s.applicantAuth(http.HandlerFunc(s.launchApplicantUpload)))
	mux.Handle("GET /api/v1/launch-bharat/applicant/documents/{id}", s.applicantAuth(http.HandlerFunc(s.launchApplicantDocument)))
	mux.HandleFunc("POST /api/v1/admin/login", s.login)
	mux.Handle("GET /api/v1/admin/me", s.auth(http.HandlerFunc(s.me)))
	mux.Handle("POST /api/v1/admin/logout", s.auth(http.HandlerFunc(s.logout)))
	mux.Handle("GET /api/v1/admin/dashboard", s.auth(s.roles(http.HandlerFunc(s.dashboard), "owner", "event_manager", "ticketing_manager", "sponsorship_manager", "finance_manager", "checkin_operator", "viewer")))
	mux.Handle("GET /api/v1/admin/events", s.auth(s.roles(http.HandlerFunc(s.adminEvents), "owner", "event_manager", "ticketing_manager", "sponsorship_manager", "finance_manager", "checkin_operator", "viewer")))
	mux.Handle("POST /api/v1/admin/events", s.auth(s.roles(http.HandlerFunc(s.createEvent), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/events/{id}", s.auth(s.roles(http.HandlerFunc(s.updateEvent), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/events/{id}/registrations", s.auth(s.roles(http.HandlerFunc(s.eventRegistrations), "owner", "event_manager", "ticketing_manager", "checkin_operator")))
	mux.Handle("POST /api/v1/admin/colleges", s.auth(s.roles(http.HandlerFunc(s.createCollege), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/check-in", s.auth(s.roles(http.HandlerFunc(s.checkIn), "owner", "event_manager", "checkin_operator")))
	mux.Handle("GET /api/v1/admin/events/{id}/tickets", s.auth(s.roles(http.HandlerFunc(s.adminTickets), "owner", "event_manager", "ticketing_manager", "finance_manager", "viewer")))
	mux.Handle("POST /api/v1/admin/events/{id}/tickets", s.auth(s.roles(http.HandlerFunc(s.createTicket), "owner", "event_manager", "ticketing_manager")))
	mux.Handle("PUT /api/v1/admin/tickets/{id}", s.auth(s.roles(http.HandlerFunc(s.updateTicket), "owner", "event_manager", "ticketing_manager")))
	mux.Handle("GET /api/v1/admin/orders", s.auth(s.roles(http.HandlerFunc(s.listOrders), "owner", "event_manager", "ticketing_manager", "finance_manager")))
	mux.Handle("GET /api/v1/admin/coupons", s.auth(s.roles(http.HandlerFunc(s.listCoupons), "owner", "event_manager", "ticketing_manager", "finance_manager")))
	mux.Handle("POST /api/v1/admin/coupons", s.auth(s.roles(http.HandlerFunc(s.createCoupon), "owner", "event_manager", "ticketing_manager")))
	mux.Handle("GET /api/v1/admin/sponsors", s.auth(s.roles(http.HandlerFunc(s.listSponsors), "owner", "sponsorship_manager", "finance_manager")))
	mux.Handle("POST /api/v1/admin/sponsors", s.auth(s.roles(http.HandlerFunc(s.createSponsor), "owner", "sponsorship_manager")))
	mux.Handle("GET /api/v1/admin/sponsorship-deals", s.auth(s.roles(http.HandlerFunc(s.listDeals), "owner", "sponsorship_manager", "finance_manager")))
	mux.Handle("POST /api/v1/admin/sponsorship-deals", s.auth(s.roles(http.HandlerFunc(s.createDeal), "owner", "sponsorship_manager")))
	mux.Handle("PUT /api/v1/admin/sponsorship-deals/{id}", s.auth(s.roles(http.HandlerFunc(s.updateDeal), "owner", "sponsorship_manager")))
	mux.Handle("POST /api/v1/admin/sponsorship-deals/{id}/deliverables", s.auth(s.roles(http.HandlerFunc(s.createDeliverable), "owner", "sponsorship_manager")))
	mux.Handle("PUT /api/v1/admin/deliverables/{id}", s.auth(s.roles(http.HandlerFunc(s.updateDeliverable), "owner", "sponsorship_manager")))
	mux.Handle("GET /api/v1/admin/finance", s.auth(s.roles(http.HandlerFunc(s.financeSummary), "owner", "finance_manager")))
	mux.Handle("POST /api/v1/admin/expenses", s.auth(s.roles(http.HandlerFunc(s.createExpense), "owner", "finance_manager")))
	mux.Handle("GET /api/v1/admin/expenses", s.auth(s.roles(http.HandlerFunc(s.listExpenses), "owner", "finance_manager")))
	mux.Handle("GET /api/v1/admin/audit", s.auth(s.roles(http.HandlerFunc(s.listAudit), "owner")))
	mux.Handle("GET /api/v1/admin/launch-bharat", s.auth(s.roles(http.HandlerFunc(s.launchBharatAdmin), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/partnerships", s.auth(s.roles(http.HandlerFunc(s.launchBharatCreatePartnership), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/problems", s.auth(s.roles(http.HandlerFunc(s.launchBharatCreateProblem), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/teams/{id}/stage", s.auth(s.roles(http.HandlerFunc(s.launchBharatUpdateTeamStage), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/teams/{id}/evaluations", s.auth(s.roles(http.HandlerFunc(s.launchBharatEvaluateTeam), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/launch-bharat/operations", s.auth(s.roles(http.HandlerFunc(s.launchOperationsAdmin), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/program", s.auth(s.roles(http.HandlerFunc(s.launchProgramUpdate), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/launch-bharat/teams/{id}", s.auth(s.roles(http.HandlerFunc(s.launchTeamDetail), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/teams/{id}/review", s.auth(s.roles(http.HandlerFunc(s.launchTeamReview), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/launch-bharat/documents/{id}", s.auth(s.roles(http.HandlerFunc(s.launchAdminDocument), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/partnerships/{id}", s.auth(s.roles(http.HandlerFunc(s.launchPartnershipUpdate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/partnerships/{id}/documents", s.auth(s.roles(http.HandlerFunc(s.launchPartnershipUpload), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/inquiries/{id}", s.auth(s.roles(http.HandlerFunc(s.launchInquiryUpdate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/experts", s.auth(s.roles(http.HandlerFunc(s.launchExpertCreate), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/experts/{id}", s.auth(s.roles(http.HandlerFunc(s.launchExpertUpdate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/expert-assignments", s.auth(s.roles(http.HandlerFunc(s.launchExpertAssignmentCreate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/sessions", s.auth(s.roles(http.HandlerFunc(s.launchSessionCreate), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/sessions/{id}", s.auth(s.roles(http.HandlerFunc(s.launchSessionUpdate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/pitch-slots", s.auth(s.roles(http.HandlerFunc(s.launchPitchSlotCreate), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/pitch-slots/{id}", s.auth(s.roles(http.HandlerFunc(s.launchPitchSlotUpdate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/referrals", s.auth(s.roles(http.HandlerFunc(s.launchReferralCreate), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/referrals/{id}", s.auth(s.roles(http.HandlerFunc(s.launchReferralUpdate), "owner", "event_manager")))
	mux.Handle("POST /api/v1/admin/launch-bharat/milestones", s.auth(s.roles(http.HandlerFunc(s.launchMilestoneCreate), "owner", "event_manager")))
	mux.Handle("PUT /api/v1/admin/launch-bharat/milestones/{id}", s.auth(s.roles(http.HandlerFunc(s.launchMilestoneUpdate), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/launch-bharat/report", s.auth(s.roles(http.HandlerFunc(s.launchReport), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/launch-bharat/report.csv", s.auth(s.roles(http.HandlerFunc(s.launchReportCSV), "owner", "event_manager")))
	mux.Handle("GET /api/v1/admin/organization/members", s.auth(s.roles(http.HandlerFunc(s.organizationMembers), "owner")))
	mux.Handle("POST /api/v1/admin/organization/members", s.auth(s.roles(http.HandlerFunc(s.organizationMemberCreate), "owner")))
	mux.Handle("PUT /api/v1/admin/organization/members/{id}", s.auth(s.roles(http.HandlerFunc(s.organizationMemberUpdate), "owner")))
	mux.Handle("GET /api/v1/admin/platform/organizations", s.auth(s.platformRoles(http.HandlerFunc(s.platformOrganizations), "super_admin")))
	mux.Handle("POST /api/v1/admin/platform/organizations", s.auth(s.platformRoles(http.HandlerFunc(s.platformOrganizationCreate), "super_admin")))
	mux.Handle("PUT /api/v1/admin/platform/organizations/{id}", s.auth(s.platformRoles(http.HandlerFunc(s.platformOrganizationUpdate), "super_admin")))
	mux.Handle("POST /api/v1/admin/security/mfa/setup", s.auth(http.HandlerFunc(s.mfaSetup)))
	mux.Handle("POST /api/v1/admin/security/mfa/enable", s.auth(http.HandlerFunc(s.mfaEnable)))
	mux.Handle("DELETE /api/v1/admin/security/mfa", s.auth(http.HandlerFunc(s.mfaDisable)))
	return s.middleware(mux)
}

func (s *Server) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && origin != s.allowedOrigin {
			fail(w, http.StatusForbidden, "origin is not allowed")
			return
		}
		if origin == s.allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", s.allowedOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		w.Header().Add("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(self), geolocation=(), microphone=()")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		if strings.HasPrefix(s.webURL, "https://") {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		if strings.HasPrefix(r.URL.Path, "/api/v1/admin/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		start := time.Now()
		next.ServeHTTP(w, r)
		s.logger.Info("request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(start))
	})
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

func (s *Server) allowRequest(key string, maximum int, window time.Duration) bool {
	now := time.Now()
	s.limitMu.Lock()
	defer s.limitMu.Unlock()
	current := s.limits[key]
	if current.resetAt.IsZero() || now.After(current.resetAt) {
		current = requestLimit{resetAt: now.Add(window)}
	}
	if current.count >= maximum {
		return false
	}
	current.count++
	s.limits[key] = current
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func fail(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{"error": message})
}
func decode(r *http.Request, v any) error {
	d := json.NewDecoder(http.MaxBytesReader(nil, r.Body, 1<<20))
	d.DisallowUnknownFields()
	return d.Decode(v)
}
func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "ok", "service": "eventwallah-api"})
}

const collegeSelect = `SELECT c.id,c.slug,c.name,c.short_name,c.institution_type,c.ownership,c.city,c.state,c.website,c.logo_url,COUNT(CASE WHEN e.status='published' THEN 1 END) FROM colleges c LEFT JOIN events e ON e.college_id=c.id`

func scanCollege(rows interface{ Scan(...any) error }) (College, error) {
	var c College
	err := rows.Scan(&c.ID, &c.Slug, &c.Name, &c.ShortName, &c.InstitutionType, &c.Ownership, &c.City, &c.State, &c.Website, &c.LogoURL, &c.EventCount)
	return c, err
}

func (s *Server) listColleges(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	state := strings.TrimSpace(r.URL.Query().Get("state"))
	ownership := strings.TrimSpace(r.URL.Query().Get("ownership"))
	args := []any{}
	where := []string{"1=1"}
	if q != "" {
		where = append(where, "(c.name LIKE ? OR c.short_name LIKE ? OR c.city LIKE ?)")
		like := "%" + q + "%"
		args = append(args, like, like, like)
	}
	if state != "" {
		where = append(where, "c.state=?")
		args = append(args, state)
	}
	if ownership != "" {
		where = append(where, "c.ownership=?")
		args = append(args, ownership)
	}
	query := collegeSelect + " WHERE " + strings.Join(where, " AND ") + " GROUP BY c.id ORDER BY c.name LIMIT 100"
	rows, err := s.store.DB.QueryContext(r.Context(), query, args...)
	if err != nil {
		fail(w, 500, "could not load institutions")
		return
	}
	defer rows.Close()
	items := []College{}
	for rows.Next() {
		c, err := scanCollege(rows)
		if err != nil {
			fail(w, 500, "could not read institutions")
			return
		}
		items = append(items, c)
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) getCollege(w http.ResponseWriter, r *http.Request) {
	row := s.store.DB.QueryRowContext(r.Context(), collegeSelect+" WHERE c.slug=? GROUP BY c.id", r.PathValue("slug"))
	c, err := scanCollege(row)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "institution not found")
		return
	}
	if err != nil {
		fail(w, 500, "could not load institution")
		return
	}
	writeJSON(w, 200, c)
}

const eventSelect = `SELECT e.id,e.college_id,c.slug,c.name,c.city,e.slug,e.title,e.category,e.summary,e.description,e.venue,e.starts_at,e.ends_at,e.registration_deadline,e.capacity,e.status,e.banner_url,e.organizer_name,e.contact_email,COUNT(r.id) FROM events e JOIN colleges c ON c.id=e.college_id LEFT JOIN registrations r ON r.event_id=e.id AND r.status!='cancelled'`

func scanEvent(row interface{ Scan(...any) error }) (Event, error) {
	var e Event
	err := row.Scan(&e.ID, &e.CollegeID, &e.CollegeSlug, &e.CollegeName, &e.CollegeCity, &e.Slug, &e.Title, &e.Category, &e.Summary, &e.Description, &e.Venue, &e.StartsAt, &e.EndsAt, &e.RegistrationDeadline, &e.Capacity, &e.Status, &e.BannerURL, &e.OrganizerName, &e.ContactEmail, &e.RegistrationCount)
	return e, err
}
func (s *Server) eventsQuery(w http.ResponseWriter, r *http.Request, collegeSlug string, admin bool) {
	args := []any{}
	where := []string{"1=1"}
	if !admin {
		where = append(where, "e.status='published'")
	} else {
		_, orgID, _, err := s.adminScope(r)
		if err != nil {
			fail(w, 403, "organization access required")
			return
		}
		where = append(where, "EXISTS(SELECT 1 FROM organization_events oe WHERE oe.event_id=e.id AND oe.organization_id=?)")
		args = append(args, orgID)
	}
	if collegeSlug != "" {
		where = append(where, "c.slug=?")
		args = append(args, collegeSlug)
	}
	if q := strings.TrimSpace(r.URL.Query().Get("q")); q != "" {
		where = append(where, "(e.title LIKE ? OR e.category LIKE ? OR c.name LIKE ?)")
		like := "%" + q + "%"
		args = append(args, like, like, like)
	}
	if category := r.URL.Query().Get("category"); category != "" {
		where = append(where, "e.category=?")
		args = append(args, category)
	}
	rows, err := s.store.DB.QueryContext(r.Context(), eventSelect+" WHERE "+strings.Join(where, " AND ")+" GROUP BY e.id ORDER BY e.starts_at", args...)
	if err != nil {
		fail(w, 500, "could not load events")
		return
	}
	defer rows.Close()
	items := []Event{}
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			fail(w, 500, "could not read events")
			return
		}
		items = append(items, e)
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) listEvents(w http.ResponseWriter, r *http.Request) { s.eventsQuery(w, r, "", false) }
func (s *Server) collegeEvents(w http.ResponseWriter, r *http.Request) {
	s.eventsQuery(w, r, r.PathValue("slug"), false)
}
func (s *Server) getEvent(w http.ResponseWriter, r *http.Request) {
	row := s.store.DB.QueryRowContext(r.Context(), eventSelect+" WHERE e.slug=? AND e.status='published' GROUP BY e.id", r.PathValue("slug"))
	e, err := scanEvent(row)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "event not found")
		return
	}
	if err != nil {
		fail(w, 500, "could not load event")
		return
	}
	writeJSON(w, 200, e)
}

func randomToken(bytes int) (string, error) {
	b := make([]byte, bytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func randomReference(prefix string, byteCount, length int) (string, error) {
	raw, err := randomToken(byteCount)
	if err != nil {
		return "", err
	}
	if len(raw) < length {
		return "", errors.New("generated reference is shorter than requested")
	}
	return prefix + strings.ToUpper(raw[:length]), nil
}
func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var in struct {
		FullName    string `json:"fullName"`
		Email       string `json:"email"`
		Phone       string `json:"phone"`
		CollegeName string `json:"collegeName"`
		Course      string `json:"course"`
		YearOfStudy string `json:"yearOfStudy"`
	}
	if err := decode(r, &in); err != nil {
		fail(w, 400, "invalid registration details")
		return
	}
	in.FullName = strings.TrimSpace(in.FullName)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.FullName == "" || !strings.Contains(in.Email, "@") || len(strings.TrimSpace(in.Phone)) < 10 || in.CollegeName == "" || in.Course == "" || in.YearOfStudy == "" {
		fail(w, 422, "complete all required fields")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "registration unavailable")
		return
	}
	defer tx.Rollback()
	var eventID int64
	var title, status, deadline string
	var capacity, count int
	err = tx.QueryRowContext(r.Context(), `SELECT e.id,e.title,e.status,e.registration_deadline,e.capacity,COUNT(r.id) FROM events e LEFT JOIN registrations r ON r.event_id=e.id AND r.status!='cancelled' WHERE e.slug=? GROUP BY e.id`, r.PathValue("slug")).Scan(&eventID, &title, &status, &deadline, &capacity, &count)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "event not found")
		return
	}
	if err != nil {
		fail(w, 500, "registration unavailable")
		return
	}
	if status != "published" {
		fail(w, 409, "registration is not open")
		return
	}
	if count >= capacity {
		fail(w, 409, "this event is full")
		return
	}
	if t, err := time.Parse(time.RFC3339, deadline); err == nil && time.Now().After(t) {
		fail(w, 409, "registration deadline has passed")
		return
	}
	token, err := randomToken(24)
	if err != nil {
		fail(w, 500, "could not secure registration")
		return
	}
	publicID, err := randomReference("EW-", 6, 8)
	if err != nil {
		fail(w, 500, "could not secure registration")
		return
	}
	res, err := tx.ExecContext(r.Context(), `INSERT INTO registrations(public_id,event_id,full_name,email,phone,college_name,course,year_of_study,pass_token) VALUES(?,?,?,?,?,?,?,?,?)`, publicID, eventID, in.FullName, in.Email, strings.TrimSpace(in.Phone), strings.TrimSpace(in.CollegeName), strings.TrimSpace(in.Course), strings.TrimSpace(in.YearOfStudy), token)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			fail(w, 409, "this email is already registered for the event")
			return
		}
		fail(w, 500, "could not complete registration")
		return
	}
	id, _ := res.LastInsertId()
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not complete registration")
		return
	}
	writeJSON(w, 201, Registration{ID: id, PublicID: publicID, EventID: eventID, EventTitle: title, FullName: in.FullName, Email: in.Email, Phone: in.Phone, CollegeName: in.CollegeName, Course: in.Course, YearOfStudy: in.YearOfStudy, PassToken: token, Status: "confirmed", QRURL: "/api/v1/passes/" + token + "/qr", PassURL: s.webURL + "/pass/" + token})
}

func (s *Server) getPass(w http.ResponseWriter, r *http.Request) {
	var reg Registration
	err := s.store.DB.QueryRowContext(r.Context(), `SELECT r.public_id,r.full_name,r.college_name,r.course,r.year_of_study,r.status,r.checked_in_at,r.created_at,e.slug,e.title,e.starts_at,e.venue,c.name FROM registrations r JOIN events e ON e.id=r.event_id JOIN colleges c ON c.id=e.college_id WHERE r.pass_token=?`, r.PathValue("token")).Scan(&reg.PublicID, &reg.FullName, &reg.CollegeName, &reg.Course, &reg.YearOfStudy, &reg.Status, &reg.CheckedInAt, &reg.CreatedAt, &reg.EventSlug, &reg.EventTitle, &reg.Phone, &reg.Email, &reg.PassURL)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "pass not found")
		return
	}
	if err != nil {
		fail(w, 500, "could not load pass")
		return
	}
	writeJSON(w, 200, map[string]any{"publicId": reg.PublicID, "fullName": reg.FullName, "studentCollege": reg.CollegeName, "course": reg.Course, "yearOfStudy": reg.YearOfStudy, "status": reg.Status, "checkedInAt": reg.CheckedInAt, "eventSlug": reg.EventSlug, "eventTitle": reg.EventTitle, "startsAt": reg.Phone, "venue": reg.Email, "hostCollege": reg.PassURL, "qrUrl": "/api/v1/passes/" + r.PathValue("token") + "/qr"})
}
func (s *Server) passQR(w http.ResponseWriter, r *http.Request) {
	var exists int
	if err := s.store.DB.QueryRowContext(r.Context(), "SELECT 1 FROM registrations WHERE pass_token=?", r.PathValue("token")).Scan(&exists); err != nil {
		fail(w, 404, "pass not found")
		return
	}
	png, err := qrcode.Encode(s.webURL+"/pass/"+r.PathValue("token"), qrcode.Medium, 384)
	if err != nil {
		fail(w, 500, "could not create QR")
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "private, max-age=3600")
	_, _ = w.Write(png)
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if !s.allowRequest("login:"+clientIP(r), 8, 15*time.Minute) {
		fail(w, http.StatusTooManyRequests, "too many sign-in attempts; try again later")
		return
	}
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		OTP      string `json:"otp"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid login details")
		return
	}
	var id int64
	var name, email, role, hash string
	err := s.store.DB.QueryRowContext(r.Context(), "SELECT id,name,email,role,password_hash FROM admins WHERE email=?", strings.ToLower(strings.TrimSpace(in.Email))).Scan(&id, &name, &email, &role, &hash)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		fail(w, 401, "incorrect email or password")
		return
	}
	var encryptedSecret string
	var mfaEnabled int
	err = s.store.DB.QueryRowContext(r.Context(), "SELECT secret_encrypted,enabled FROM admin_mfa WHERE admin_id=?", id).Scan(&encryptedSecret, &mfaEnabled)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		fail(w, 500, "could not verify sign-in")
		return
	}
	if mfaEnabled == 1 {
		secret, decryptErr := s.decryptSecret(encryptedSecret)
		if decryptErr != nil || !validTOTP(secret, strings.TrimSpace(in.OTP), time.Now()) {
			fail(w, 401, "a valid authenticator code is required")
			return
		}
	}
	token, err := randomToken(32)
	if err != nil {
		fail(w, 500, "could not create session")
		return
	}
	expires := time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339)
	_, _ = s.store.DB.ExecContext(r.Context(), "DELETE FROM sessions WHERE expires_at<=?", store.Now())
	if _, err = s.store.DB.ExecContext(r.Context(), "INSERT INTO sessions(admin_id,token_hash,expires_at) VALUES(?,?,?)", id, hashToken(token), expires); err != nil {
		fail(w, 500, "could not create session")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "eventwallah_admin_session", Value: token, Path: "/", HttpOnly: true, Secure: strings.HasPrefix(s.webURL, "https://"), SameSite: http.SameSiteStrictMode, MaxAge: 86400})
	writeJSON(w, 200, map[string]any{"expiresAt": expires, "admin": map[string]any{"id": id, "name": name, "email": email, "role": role}})
}
func (s *Server) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		token := ""
		if strings.HasPrefix(h, "Bearer ") {
			token = strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		} else if cookie, err := r.Cookie("eventwallah_admin_session"); err == nil {
			token = cookie.Value
		}
		if token == "" {
			fail(w, 401, "authentication required")
			return
		}
		var id int64
		var name, email, role string
		err := s.store.DB.QueryRowContext(r.Context(), `SELECT a.id,a.name,a.email,a.role FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?`, hashToken(token), store.Now()).Scan(&id, &name, &email, &role)
		if err != nil {
			fail(w, 401, "session expired or invalid")
			return
		}
		ctx := context.WithValue(r.Context(), adminContextKey{}, map[string]any{"id": id, "name": name, "email": email, "role": role, "tokenHash": hashToken(token)})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	identity := r.Context().Value(adminContextKey{}).(map[string]any)
	_, orgID, orgRole, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	writeJSON(w, 200, map[string]any{"id": identity["id"], "name": identity["name"], "email": identity["email"], "platformRole": identity["role"], "organizationId": orgID, "organizationRole": orgRole})
}
func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	admin := r.Context().Value(adminContextKey{}).(map[string]any)
	_, _ = s.store.DB.ExecContext(r.Context(), "DELETE FROM sessions WHERE token_hash=?", admin["tokenHash"])
	http.SetCookie(w, &http.Cookie{Name: "eventwallah_admin_session", Value: "", Path: "/", HttpOnly: true, Secure: strings.HasPrefix(s.webURL, "https://"), SameSite: http.SameSiteStrictMode, MaxAge: -1})
	w.WriteHeader(204)
}
func (s *Server) dashboard(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var institutions, events, registrations, checkins int
	s.store.DB.QueryRowContext(r.Context(), "SELECT COUNT(*) FROM colleges").Scan(&institutions)
	s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM events e JOIN organization_events oe ON oe.event_id=e.id WHERE oe.organization_id=? AND e.status='published'`, orgID).Scan(&events)
	s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM registrations r JOIN organization_events oe ON oe.event_id=r.event_id WHERE oe.organization_id=? AND r.status!='cancelled'`, orgID).Scan(&registrations)
	s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM registrations r JOIN organization_events oe ON oe.event_id=r.event_id WHERE oe.organization_id=? AND r.status='checked_in'`, orgID).Scan(&checkins)
	writeJSON(w, 200, map[string]int{"institutions": institutions, "publishedEvents": events, "registrations": registrations, "checkIns": checkins})
}
func (s *Server) adminEvents(w http.ResponseWriter, r *http.Request) { s.eventsQuery(w, r, "", true) }

type eventInput struct {
	CollegeID            int64  `json:"collegeId"`
	Title                string `json:"title"`
	Category             string `json:"category"`
	Summary              string `json:"summary"`
	Description          string `json:"description"`
	Venue                string `json:"venue"`
	StartsAt             string `json:"startsAt"`
	EndsAt               string `json:"endsAt"`
	RegistrationDeadline string `json:"registrationDeadline"`
	Capacity             int    `json:"capacity"`
	Status               string `json:"status"`
	BannerURL            string `json:"bannerUrl"`
	OrganizerName        string `json:"organizerName"`
	ContactEmail         string `json:"contactEmail"`
}

func validateEvent(in eventInput) error {
	if in.CollegeID < 1 || strings.TrimSpace(in.Title) == "" || in.Category == "" || in.Summary == "" || in.Description == "" || in.Venue == "" || in.Capacity < 1 || in.OrganizerName == "" || !strings.Contains(in.ContactEmail, "@") {
		return errors.New("complete all required event fields")
	}
	for _, v := range []string{in.StartsAt, in.EndsAt, in.RegistrationDeadline} {
		if _, err := time.Parse(time.RFC3339, v); err != nil {
			return errors.New("dates must use RFC3339 format")
		}
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	return nil
}
func (s *Server) createEvent(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in eventInput
	if decode(r, &in) != nil {
		fail(w, 400, "invalid event details")
		return
	}
	if err := validateEvent(in); err != nil {
		fail(w, 422, err.Error())
		return
	}
	slug := store.Slugify(in.Title)
	var n int
	s.store.DB.QueryRowContext(r.Context(), "SELECT COUNT(*) FROM events WHERE slug=?", slug).Scan(&n)
	if n > 0 {
		slug += fmt.Sprintf("-%d", time.Now().Unix()%10000)
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "could not start event creation")
		return
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(r.Context(), `INSERT INTO events(college_id,slug,title,category,summary,description,venue,starts_at,ends_at,registration_deadline,capacity,status,banner_url,organizer_name,contact_email) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, in.CollegeID, slug, in.Title, in.Category, in.Summary, in.Description, in.Venue, in.StartsAt, in.EndsAt, in.RegistrationDeadline, in.Capacity, in.Status, in.BannerURL, in.OrganizerName, in.ContactEmail)
	if err != nil {
		fail(w, 422, "could not create event: "+err.Error())
		return
	}
	id, _ := res.LastInsertId()
	if _, err = tx.ExecContext(r.Context(), `INSERT INTO organization_events(organization_id,event_id) VALUES(?,?)`, orgID, id); err != nil {
		fail(w, 500, "could not assign event to organization")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not finish event creation")
		return
	}
	s.audit(r, "event.created", "event", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id, "slug": slug})
}
func (s *Server) updateEvent(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid event id")
		return
	}
	var in eventInput
	if decode(r, &in) != nil {
		fail(w, 400, "invalid event details")
		return
	}
	if err = validateEvent(in); err != nil {
		fail(w, 422, err.Error())
		return
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	res, err := s.store.DB.ExecContext(r.Context(), `UPDATE events SET college_id=?,title=?,category=?,summary=?,description=?,venue=?,starts_at=?,ends_at=?,registration_deadline=?,capacity=?,status=?,banner_url=?,organizer_name=?,contact_email=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM organization_events oe WHERE oe.event_id=events.id AND oe.organization_id=?)`, in.CollegeID, in.Title, in.Category, in.Summary, in.Description, in.Venue, in.StartsAt, in.EndsAt, in.RegistrationDeadline, in.Capacity, in.Status, in.BannerURL, in.OrganizerName, in.ContactEmail, id, orgID)
	if err != nil {
		fail(w, 422, "could not update event")
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		fail(w, 404, "event not found")
		return
	}
	s.audit(r, "event.updated", "event", id, `{}`)
	writeJSON(w, 200, map[string]any{"id": id, "updated": true})
}
func (s *Server) eventRegistrations(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid event id")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT r.id,r.public_id,r.event_id,e.slug,e.title,r.full_name,r.email,r.phone,r.college_name,r.course,r.year_of_study,r.status,r.checked_in_at,r.created_at FROM registrations r JOIN events e ON e.id=r.event_id JOIN organization_events oe ON oe.event_id=e.id WHERE r.event_id=? AND oe.organization_id=? ORDER BY r.created_at DESC`, id, orgID)
	if err != nil {
		fail(w, 500, "could not load registrations")
		return
	}
	defer rows.Close()
	items := []Registration{}
	for rows.Next() {
		var x Registration
		if err := rows.Scan(&x.ID, &x.PublicID, &x.EventID, &x.EventSlug, &x.EventTitle, &x.FullName, &x.Email, &x.Phone, &x.CollegeName, &x.Course, &x.YearOfStudy, &x.Status, &x.CheckedInAt, &x.CreatedAt); err != nil {
			fail(w, 500, "could not read registrations")
			return
		}
		items = append(items, x)
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) createCollege(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name            string `json:"name"`
		ShortName       string `json:"shortName"`
		InstitutionType string `json:"institutionType"`
		Ownership       string `json:"ownership"`
		City            string `json:"city"`
		State           string `json:"state"`
		Website         string `json:"website"`
		LogoURL         string `json:"logoUrl"`
	}
	if decode(r, &in) != nil || in.Name == "" || in.City == "" || in.State == "" {
		fail(w, 422, "complete all required institution fields")
		return
	}
	slug := store.Slugify(in.Name)
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO colleges(slug,name,short_name,institution_type,ownership,city,state,website,logo_url) VALUES(?,?,?,?,?,?,?,?,?)`, slug, in.Name, in.ShortName, in.InstitutionType, in.Ownership, in.City, in.State, in.Website, in.LogoURL)
	if err != nil {
		fail(w, 422, "institution already exists or has invalid values")
		return
	}
	id, _ := res.LastInsertId()
	writeJSON(w, 201, map[string]any{"id": id, "slug": slug})
}
func (s *Server) checkIn(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in struct {
		Token string `json:"token"`
	}
	if decode(r, &in) != nil || strings.TrimSpace(in.Token) == "" {
		fail(w, 422, "pass token is required")
		return
	}
	token := strings.TrimSpace(in.Token)
	if strings.Contains(token, "/pass/") {
		parts := strings.Split(token, "/pass/")
		token = strings.Trim(parts[len(parts)-1], "/")
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "check-in unavailable")
		return
	}
	defer tx.Rollback()
	var publicID, name, event, status string
	err = tx.QueryRowContext(r.Context(), `SELECT r.public_id,r.full_name,e.title,r.status FROM registrations r JOIN events e ON e.id=r.event_id JOIN organization_events oe ON oe.event_id=e.id WHERE r.pass_token=? AND oe.organization_id=?`, token, orgID).Scan(&publicID, &name, &event, &status)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "invalid pass")
		return
	}
	if status == "cancelled" {
		fail(w, 409, "this registration was cancelled")
		return
	}
	if status == "checked_in" {
		fail(w, 409, "this pass has already been checked in")
		return
	}
	now := store.Now()
	if _, err = tx.ExecContext(r.Context(), "UPDATE registrations SET status='checked_in',checked_in_at=? WHERE pass_token=?", now, token); err != nil {
		fail(w, 500, "could not check in pass")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not check in pass")
		return
	}
	s.audit(r, "registration.checked_in", "registration", publicID, `{}`)
	writeJSON(w, 200, map[string]any{"publicId": publicID, "fullName": name, "eventTitle": event, "status": "checked_in", "checkedInAt": now})
}
