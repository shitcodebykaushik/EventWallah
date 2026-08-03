package httpapi

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/base64"
	"encoding/binary"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
	"golang.org/x/crypto/bcrypt"
)

var organizationRoles = map[string]bool{"owner": true, "event_manager": true, "ticketing_manager": true, "sponsorship_manager": true, "finance_manager": true, "checkin_operator": true, "viewer": true}

func (s *Server) platformRoles(next http.Handler, allowed ...string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		identity, ok := r.Context().Value(adminContextKey{}).(map[string]any)
		if !ok {
			fail(w, 401, "authentication required")
			return
		}
		for _, role := range allowed {
			if identity["role"] == role {
				next.ServeHTTP(w, r)
				return
			}
		}
		fail(w, 403, "your platform role cannot perform this action")
	})
}

func (s *Server) organizationMembers(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT a.id,a.name,a.email,a.role,om.role,om.status,om.created_at FROM organization_members om JOIN admins a ON a.id=om.admin_id WHERE om.organization_id=? ORDER BY a.name`, orgID)
	if err != nil {
		fail(w, 500, "could not load members")
		return
	}
	defer rows.Close()
	members := []map[string]any{}
	for rows.Next() {
		var id int64
		var name, email, platformRole, role, status, created string
		if rows.Scan(&id, &name, &email, &platformRole, &role, &status, &created) == nil {
			members = append(members, map[string]any{"id": id, "name": name, "email": email, "platformRole": platformRole, "role": role, "status": status, "createdAt": created})
		}
	}
	writeJSON(w, 200, members)
}

func (s *Server) organizationMemberCreate(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid member details")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Name == "" || !strings.Contains(in.Email, "@") || len(in.Password) < 12 || !organizationRoles[in.Role] {
		fail(w, 400, "provide a name, valid email, 12-character password and role")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "could not secure member")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "could not create member")
		return
	}
	defer tx.Rollback()
	var adminID int64
	err = tx.QueryRowContext(r.Context(), "SELECT id FROM admins WHERE email=?", in.Email).Scan(&adminID)
	if err != nil {
		result, insertErr := tx.ExecContext(r.Context(), "INSERT INTO admins(name,email,password_hash,role) VALUES(?,?,?,'admin')", in.Name, in.Email, string(hash))
		if insertErr != nil {
			fail(w, 409, "an account already uses this email")
			return
		}
		adminID, _ = result.LastInsertId()
	}
	if _, err = tx.ExecContext(r.Context(), "INSERT INTO organization_members(organization_id,admin_id,role,status) VALUES(?,?,?,'active')", orgID, adminID, in.Role); err != nil {
		fail(w, 409, "this account is already a member")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not create member")
		return
	}
	s.audit(r, "member.created", "admin", adminID, `{"role":"`+in.Role+`"}`)
	writeJSON(w, 201, map[string]any{"id": adminID, "name": in.Name, "email": in.Email, "role": in.Role, "status": "active"})
}

func (s *Server) organizationMemberUpdate(w http.ResponseWriter, r *http.Request) {
	adminID, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	targetID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || targetID < 1 {
		fail(w, 400, "invalid member")
		return
	}
	var in struct {
		Role   string `json:"role"`
		Status string `json:"status"`
	}
	if decode(r, &in) != nil || !organizationRoles[in.Role] || (in.Status != "active" && in.Status != "invited" && in.Status != "disabled") {
		fail(w, 400, "invalid role or status")
		return
	}
	if targetID == adminID && in.Status != "active" {
		fail(w, 400, "you cannot disable your own access")
		return
	}
	var currentRole string
	if s.store.DB.QueryRowContext(r.Context(), "SELECT role FROM organization_members WHERE organization_id=? AND admin_id=?", orgID, targetID).Scan(&currentRole) != nil {
		fail(w, 404, "member not found")
		return
	}
	if currentRole == "owner" && (in.Role != "owner" || in.Status != "active") {
		var owners int
		_ = s.store.DB.QueryRowContext(r.Context(), "SELECT COUNT(*) FROM organization_members WHERE organization_id=? AND role='owner' AND status='active'", orgID).Scan(&owners)
		if owners <= 1 {
			fail(w, 409, "the organization must retain an active owner")
			return
		}
	}
	if _, err = s.store.DB.ExecContext(r.Context(), "UPDATE organization_members SET role=?,status=? WHERE organization_id=? AND admin_id=?", in.Role, in.Status, orgID, targetID); err != nil {
		fail(w, 500, "could not update member")
		return
	}
	s.audit(r, "member.updated", "admin", targetID, `{"role":"`+in.Role+`","status":"`+in.Status+`"}`)
	writeJSON(w, 200, map[string]any{"id": targetID, "role": in.Role, "status": in.Status})
}

func (s *Server) platformOrganizations(w http.ResponseWriter, r *http.Request) {
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT o.id,o.slug,o.name,o.legal_name,o.gstin,o.email,o.phone,o.status,o.created_at,COUNT(DISTINCT om.admin_id),COUNT(DISTINCT oe.event_id) FROM organizations o LEFT JOIN organization_members om ON om.organization_id=o.id LEFT JOIN organization_events oe ON oe.organization_id=o.id GROUP BY o.id ORDER BY o.name`)
	if err != nil {
		fail(w, 500, "could not load organizations")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var slug, name, legal, gstin, email, phone, status, created string
		var members, events int
		if rows.Scan(&id, &slug, &name, &legal, &gstin, &email, &phone, &status, &created, &members, &events) == nil {
			items = append(items, map[string]any{"id": id, "slug": slug, "name": name, "legalName": legal, "gstin": gstin, "email": email, "phone": phone, "status": status, "createdAt": created, "memberCount": members, "eventCount": events})
		}
	}
	writeJSON(w, 200, items)
}

type organizationInput struct {
	Slug      string `json:"slug"`
	Name      string `json:"name"`
	LegalName string `json:"legalName"`
	GSTIN     string `json:"gstin"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Status    string `json:"status"`
}

func validateOrganization(in *organizationInput) bool {
	in.Slug = strings.ToLower(strings.TrimSpace(in.Slug))
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	return in.Slug != "" && in.Name != "" && strings.Contains(in.Email, "@") && (in.Status == "active" || in.Status == "suspended")
}
func (s *Server) platformOrganizationCreate(w http.ResponseWriter, r *http.Request) {
	var in organizationInput
	if decode(r, &in) != nil || !validateOrganization(&in) {
		fail(w, 400, "invalid organization details")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), "INSERT INTO organizations(slug,name,legal_name,gstin,email,phone,status) VALUES(?,?,?,?,?,?,?)", in.Slug, in.Name, in.LegalName, in.GSTIN, in.Email, in.Phone, in.Status)
	if err != nil {
		fail(w, 409, "organization slug already exists")
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) platformOrganizationUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	var in organizationInput
	if err != nil || decode(r, &in) != nil || !validateOrganization(&in) {
		fail(w, 400, "invalid organization details")
		return
	}
	result, err := s.store.DB.ExecContext(r.Context(), "UPDATE organizations SET slug=?,name=?,legal_name=?,gstin=?,email=?,phone=?,status=? WHERE id=?", in.Slug, in.Name, in.LegalName, in.GSTIN, in.Email, in.Phone, in.Status, id)
	if err != nil {
		fail(w, 409, "organization could not be updated")
		return
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		fail(w, 404, "organization not found")
		return
	}
	writeJSON(w, 200, map[string]any{"id": id})
}

func (s *Server) encryptSecret(secret string) (string, error) {
	block, err := aes.NewCipher(s.securityKey[:])
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := gcm.Seal(nonce, nonce, []byte(secret), nil)
	return base64.RawURLEncoding.EncodeToString(sealed), nil
}
func (s *Server) decryptSecret(value string) (string, error) {
	raw, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(s.securityKey[:])
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil || len(raw) < gcm.NonceSize() {
		return "", fmt.Errorf("invalid encrypted secret")
	}
	plain, err := gcm.Open(nil, raw[:gcm.NonceSize()], raw[gcm.NonceSize():], nil)
	return string(plain), err
}
func totpCode(secret string, at time.Time) string {
	key, _ := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(secret))
	counter := uint64(at.Unix() / 30)
	msg := make([]byte, 8)
	binary.BigEndian.PutUint64(msg, counter)
	mac := hmac.New(sha1.New, key)
	_, _ = mac.Write(msg)
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 15
	value := (uint32(sum[offset])&0x7f)<<24 | (uint32(sum[offset+1])&0xff)<<16 | (uint32(sum[offset+2])&0xff)<<8 | (uint32(sum[offset+3]) & 0xff)
	return fmt.Sprintf("%06d", value%1000000)
}
func validTOTP(secret, code string, at time.Time) bool {
	if len(code) != 6 {
		return false
	}
	for _, delta := range []time.Duration{-30 * time.Second, 0, 30 * time.Second} {
		if hmac.Equal([]byte(totpCode(secret, at.Add(delta))), []byte(code)) {
			return true
		}
	}
	return false
}
func (s *Server) mfaSetup(w http.ResponseWriter, r *http.Request) {
	identity := r.Context().Value(adminContextKey{}).(map[string]any)
	adminID := identity["id"].(int64)
	var alreadyEnabled int
	_ = s.store.DB.QueryRowContext(r.Context(), "SELECT enabled FROM admin_mfa WHERE admin_id=?", adminID).Scan(&alreadyEnabled)
	if alreadyEnabled == 1 {
		fail(w, http.StatusConflict, "MFA is already enabled; disable it with password verification before reconfiguring")
		return
	}
	raw := make([]byte, 20)
	if _, err := rand.Read(raw); err != nil {
		fail(w, 500, "could not create authenticator secret")
		return
	}
	secret := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(raw)
	encrypted, err := s.encryptSecret(secret)
	if err != nil {
		fail(w, 500, "could not protect authenticator secret")
		return
	}
	_, err = s.store.DB.ExecContext(r.Context(), `INSERT INTO admin_mfa(admin_id,secret_encrypted,enabled,updated_at) VALUES(?,?,0,CURRENT_TIMESTAMP) ON CONFLICT(admin_id) DO UPDATE SET secret_encrypted=excluded.secret_encrypted,enabled=0,confirmed_at=NULL,updated_at=CURRENT_TIMESTAMP`, adminID, encrypted)
	if err != nil {
		fail(w, 500, "could not configure MFA")
		return
	}
	issuer := "EventWallah"
	uri := "otpauth://totp/" + url.PathEscape(issuer+":"+identity["email"].(string)) + "?secret=" + secret + "&issuer=" + url.QueryEscape(issuer) + "&algorithm=SHA1&digits=6&period=30"
	writeJSON(w, 200, map[string]any{"secret": secret, "otpauthUrl": uri})
}
func (s *Server) mfaEnable(w http.ResponseWriter, r *http.Request) {
	identity := r.Context().Value(adminContextKey{}).(map[string]any)
	var in struct {
		OTP string `json:"otp"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "authenticator code required")
		return
	}
	var encrypted string
	if s.store.DB.QueryRowContext(r.Context(), "SELECT secret_encrypted FROM admin_mfa WHERE admin_id=?", identity["id"]).Scan(&encrypted) != nil {
		fail(w, 409, "start MFA setup first")
		return
	}
	secret, err := s.decryptSecret(encrypted)
	if err != nil || !validTOTP(secret, in.OTP, time.Now()) {
		fail(w, 400, "authenticator code is invalid")
		return
	}
	_, _ = s.store.DB.ExecContext(r.Context(), "UPDATE admin_mfa SET enabled=1,confirmed_at=?,updated_at=CURRENT_TIMESTAMP WHERE admin_id=?", store.Now(), identity["id"])
	writeJSON(w, 200, map[string]bool{"enabled": true})
}
func (s *Server) mfaDisable(w http.ResponseWriter, r *http.Request) {
	identity := r.Context().Value(adminContextKey{}).(map[string]any)
	var in struct {
		Password string `json:"password"`
		OTP      string `json:"otp"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "password and code required")
		return
	}
	var hash, encrypted string
	if s.store.DB.QueryRowContext(r.Context(), `SELECT a.password_hash,m.secret_encrypted FROM admins a JOIN admin_mfa m ON m.admin_id=a.id WHERE a.id=? AND m.enabled=1`, identity["id"]).Scan(&hash, &encrypted) != nil {
		fail(w, 409, "MFA is not enabled")
		return
	}
	secret, err := s.decryptSecret(encrypted)
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil || err != nil || !validTOTP(secret, in.OTP, time.Now()) {
		fail(w, 401, "password or authenticator code is invalid")
		return
	}
	_, _ = s.store.DB.ExecContext(r.Context(), "DELETE FROM admin_mfa WHERE admin_id=?", identity["id"])
	writeJSON(w, 200, map[string]bool{"enabled": false})
}
