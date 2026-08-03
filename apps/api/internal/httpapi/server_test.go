package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"testing"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
	"golang.org/x/crypto/bcrypt"
)

func testServer(t *testing.T) http.Handler {
	t.Helper()
	st, err := store.Open(filepath.Join(t.TempDir(), "eventwallah-test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = st.Close() })
	hash, _ := bcrypt.GenerateFromPassword([]byte("test-password"), bcrypt.MinCost)
	if err := st.Seed(context.Background(), string(hash)); err != nil {
		t.Fatal(err)
	}
	return New(st, "http://localhost:3000", "http://localhost:3000", slog.New(slog.NewTextHandler(io.Discard, nil)))
}

func request(t *testing.T, handler http.Handler, method, path string, body any, token string) *httptest.ResponseRecorder {
	t.Helper()
	var payload io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		payload = bytes.NewReader(encoded)
	}
	req := httptest.NewRequest(method, path, payload)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	return recorder
}

func decodeBody[T any](t *testing.T, response *httptest.ResponseRecorder) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(response.Body.Bytes(), &value); err != nil {
		t.Fatalf("decode response: %v; body=%s", err, response.Body.String())
	}
	return value
}

func loginToken(t *testing.T, handler http.Handler) string {
	t.Helper()
	login := request(t, handler, http.MethodPost, "/api/v1/admin/login", map[string]string{
		"email": "admin@eventwallah.local", "password": "test-password",
	}, "")
	if login.Code != http.StatusOK {
		t.Fatalf("login: got %d body=%s", login.Code, login.Body.String())
	}
	for _, cookie := range login.Result().Cookies() {
		if cookie.Name == "eventwallah_admin_session" && cookie.Value != "" && cookie.HttpOnly && cookie.SameSite == http.SameSiteStrictMode {
			return cookie.Value
		}
	}
	t.Fatal("login did not issue an HttpOnly SameSite=Strict session cookie")
	return ""
}

func TestRegistrationPassAndCheckInFlow(t *testing.T) {
	handler := testServer(t)

	events := request(t, handler, http.MethodGet, "/api/v1/events", nil, "")
	if events.Code != http.StatusOK {
		t.Fatalf("events: got %d", events.Code)
	}

	tickets := request(t, handler, http.MethodGet, "/api/v1/events/techfest-open-house-2026/tickets", nil, "")
	ticketList := decodeBody[struct {
		Items []TicketType `json:"items"`
	}](t, tickets)
	registration := request(t, handler, http.MethodPost, "/api/v1/events/techfest-open-house-2026/orders", map[string]any{
		"ticketTypeId": ticketList.Items[0].ID, "quantity": 1,
		"fullName": "Aarav Sharma", "email": "aarav@example.com", "phone": "9876543210",
		"collegeName": "University of Delhi", "course": "B.Tech CSE", "yearOfStudy": "2nd year",
	}, "")
	if registration.Code != http.StatusCreated {
		t.Fatalf("register: got %d body=%s", registration.Code, registration.Body.String())
	}
	created := decodeBody[struct {
		Registration Registration `json:"registration"`
	}](t, registration).Registration
	if created.PassToken == "" || created.PublicID == "" {
		t.Fatal("registration did not return a pass token and public id")
	}

	duplicate := request(t, handler, http.MethodPost, "/api/v1/events/techfest-open-house-2026/orders", map[string]any{
		"ticketTypeId": ticketList.Items[0].ID, "quantity": 1,
		"fullName": "Aarav Sharma", "email": "aarav@example.com", "phone": "9876543210",
		"collegeName": "University of Delhi", "course": "B.Tech CSE", "yearOfStudy": "2nd year",
	}, "")
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("duplicate: got %d", duplicate.Code)
	}

	pass := request(t, handler, http.MethodGet, "/api/v1/passes/"+created.PassToken, nil, "")
	if pass.Code != http.StatusOK {
		t.Fatalf("pass: got %d body=%s", pass.Code, pass.Body.String())
	}
	qr := request(t, handler, http.MethodGet, "/api/v1/passes/"+created.PassToken+"/qr", nil, "")
	if qr.Code != http.StatusOK || qr.Header().Get("Content-Type") != "image/png" {
		t.Fatalf("qr: got %d content-type=%s", qr.Code, qr.Header().Get("Content-Type"))
	}

	auth := loginToken(t, handler)

	checkIn := request(t, handler, http.MethodPost, "/api/v1/admin/check-in", map[string]string{"token": created.PassToken}, auth)
	if checkIn.Code != http.StatusOK {
		t.Fatalf("check-in: got %d body=%s", checkIn.Code, checkIn.Body.String())
	}
	secondCheckIn := request(t, handler, http.MethodPost, "/api/v1/admin/check-in", map[string]string{"token": created.PassToken}, auth)
	if secondCheckIn.Code != http.StatusConflict {
		t.Fatalf("second check-in: got %d", secondCheckIn.Code)
	}
}

func TestAdminEndpointsRequireAuthentication(t *testing.T) {
	handler := testServer(t)
	for _, path := range []string{"/api/v1/admin/me", "/api/v1/admin/dashboard", "/api/v1/admin/events"} {
		response := request(t, handler, http.MethodGet, path, nil, "")
		if response.Code != http.StatusUnauthorized {
			t.Errorf("%s: got %d, want 401", path, response.Code)
		}
	}
}

func TestCrossOriginRequestsAreRejected(t *testing.T) {
	handler := testServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events", nil)
	req.Header.Set("Origin", "https://attacker.example")
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	if recorder.Code != http.StatusForbidden {
		t.Fatalf("cross-origin request: got %d, want 403", recorder.Code)
	}
	if recorder.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("rejected origin received an access-control allow-origin header")
	}
}

func TestPaidCheckoutFailsClosedWithoutCreatingOrder(t *testing.T) {
	handler := testServer(t)
	auth := loginToken(t, handler)
	eventsResponse := request(t, handler, http.MethodGet, "/api/v1/admin/events", nil, auth)
	events := decodeBody[struct {
		Items []Event `json:"items"`
	}](t, eventsResponse)
	if len(events.Items) == 0 {
		t.Fatal("organization has no event for paid checkout test")
	}
	event := events.Items[0]
	ticketResponse := request(t, handler, http.MethodPost, "/api/v1/admin/events/"+strconv.FormatInt(event.ID, 10)+"/tickets", map[string]any{
		"name": "Paid Test Pass", "description": "Must not be issued without verified payment",
		"pricePaise": 25000, "capacity": 25, "minPerOrder": 1, "maxPerOrder": 2,
		"salesStart": "2026-01-01T00:00:00Z", "salesEnd": "2027-12-31T23:59:59Z", "status": "active",
	}, auth)
	if ticketResponse.Code != http.StatusCreated {
		t.Fatalf("create paid ticket: got %d body=%s", ticketResponse.Code, ticketResponse.Body.String())
	}
	ticket := decodeBody[struct {
		ID int64 `json:"id"`
	}](t, ticketResponse)
	checkout := request(t, handler, http.MethodPost, "/api/v1/events/"+event.Slug+"/orders", map[string]any{
		"ticketTypeId": ticket.ID, "quantity": 1, "fullName": "Paid Buyer", "email": "paid@example.com",
		"phone": "9876543210", "collegeName": "IIT Bombay", "course": "B.Tech", "yearOfStudy": "2nd year",
	}, "")
	if checkout.Code != http.StatusServiceUnavailable {
		t.Fatalf("paid checkout: got %d body=%s", checkout.Code, checkout.Body.String())
	}
	orders := request(t, handler, http.MethodGet, "/api/v1/admin/orders", nil, auth)
	orderList := decodeBody[struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}](t, orders)
	if len(orderList.Items) != 0 {
		t.Fatalf("paid checkout created %d order(s), want 0", len(orderList.Items))
	}
}

func TestCommercialERPFlow(t *testing.T) {
	handler := testServer(t)
	auth := loginToken(t, handler)

	ticketResponse := request(t, handler, http.MethodGet, "/api/v1/events/techfest-open-house-2026/tickets", nil, "")
	if ticketResponse.Code != http.StatusOK {
		t.Fatalf("tickets: got %d body=%s", ticketResponse.Code, ticketResponse.Body.String())
	}
	ticketList := decodeBody[struct {
		Items []TicketType `json:"items"`
	}](t, ticketResponse)
	if len(ticketList.Items) == 0 {
		t.Fatal("seed event has no ticket inventory")
	}

	checkout := request(t, handler, http.MethodPost, "/api/v1/events/techfest-open-house-2026/orders", map[string]any{
		"ticketTypeId": ticketList.Items[0].ID,
		"quantity":     1,
		"fullName":     "Commercial Test",
		"email":        "commercial@example.com",
		"phone":        "9876543210",
		"collegeName":  "IIT Bombay",
		"course":       "B.Tech",
		"yearOfStudy":  "3rd year",
	}, "")
	if checkout.Code != http.StatusCreated {
		t.Fatalf("checkout: got %d body=%s", checkout.Code, checkout.Body.String())
	}
	confirmed := decodeBody[struct {
		Status       string        `json:"status"`
		Registration *Registration `json:"registration"`
	}](t, checkout)
	if confirmed.Status != "confirmed" || confirmed.Registration == nil || confirmed.Registration.PassToken == "" {
		t.Fatal("free checkout did not issue a confirmed QR registration")
	}

	eventsResponse := request(t, handler, http.MethodGet, "/api/v1/admin/events", nil, auth)
	events := decodeBody[struct {
		Items []Event `json:"items"`
	}](t, eventsResponse)
	if len(events.Items) == 0 {
		t.Fatal("organization has no events")
	}
	eventID := events.Items[0].ID

	coupon := request(t, handler, http.MethodPost, "/api/v1/admin/coupons", map[string]any{
		"eventId": eventID, "code": "TEST25", "discountType": "percentage", "discountValue": 25,
		"minimumOrderPaise": 0, "usageLimit": 10,
		"startsAt": "2026-01-01T00:00:00Z", "endsAt": "2027-12-31T23:59:59Z",
	}, auth)
	if coupon.Code != http.StatusCreated {
		t.Fatalf("coupon: got %d body=%s", coupon.Code, coupon.Body.String())
	}

	sponsorResponse := request(t, handler, http.MethodPost, "/api/v1/admin/sponsors", map[string]string{
		"name": "Acme India", "industry": "Technology", "website": "https://example.com",
		"contactName": "Ria Kapoor", "contactEmail": "ria@example.com", "contactPhone": "9876543210",
	}, auth)
	if sponsorResponse.Code != http.StatusCreated {
		t.Fatalf("sponsor: got %d body=%s", sponsorResponse.Code, sponsorResponse.Body.String())
	}
	sponsor := decodeBody[struct {
		ID int64 `json:"id"`
	}](t, sponsorResponse)

	dealResponse := request(t, handler, http.MethodPost, "/api/v1/admin/sponsorship-deals", map[string]any{
		"eventId": eventID, "sponsorId": sponsor.ID, "stage": "proposal",
		"contractedValuePaise": 500000, "cashValuePaise": 500000, "inKindValuePaise": 0,
		"receivedPaise": 100000, "ownerName": "EventWallah Admin", "nextAction": "Review contract",
	}, auth)
	if dealResponse.Code != http.StatusCreated {
		t.Fatalf("deal: got %d body=%s", dealResponse.Code, dealResponse.Body.String())
	}
	deal := decodeBody[struct {
		ID int64 `json:"id"`
	}](t, dealResponse)
	deliverable := request(t, handler, http.MethodPost, "/api/v1/admin/sponsorship-deals/"+strconv.FormatInt(deal.ID, 10)+"/deliverables", map[string]any{
		"title": "Stage logo placement", "ownerName": "Production", "dueAt": "2026-09-01T12:00:00Z",
	}, auth)
	if deliverable.Code != http.StatusCreated {
		t.Fatalf("deliverable: got %d body=%s", deliverable.Code, deliverable.Body.String())
	}

	deals := request(t, handler, http.MethodGet, "/api/v1/admin/sponsorship-deals", nil, auth)
	if deals.Code != http.StatusOK {
		t.Fatalf("deals: got %d body=%s", deals.Code, deals.Body.String())
	}
	dealList := decodeBody[struct {
		Items []Deal `json:"items"`
	}](t, deals)
	if len(dealList.Items) != 1 || len(dealList.Items[0].Deliverables) != 1 {
		t.Fatal("deal pipeline did not include its deliverable")
	}

	expense := request(t, handler, http.MethodPost, "/api/v1/admin/expenses", map[string]any{
		"eventId": eventID, "category": "Production", "vendorName": "Stage Works",
		"description": "Audio setup", "amountPaise": 250000, "taxPaise": 45000,
		"paymentStatus": "approved", "incurredAt": "2026-08-02T10:00:00Z",
	}, auth)
	if expense.Code != http.StatusCreated {
		t.Fatalf("expense: got %d body=%s", expense.Code, expense.Body.String())
	}
	for _, path := range []string{"/api/v1/admin/orders", "/api/v1/admin/coupons", "/api/v1/admin/finance", "/api/v1/admin/expenses", "/api/v1/admin/audit"} {
		response := request(t, handler, http.MethodGet, path, nil, auth)
		if response.Code != http.StatusOK {
			t.Errorf("%s: got %d body=%s", path, response.Code, response.Body.String())
		}
	}
}

func TestLaunchBharatApplicationAndAdminFlow(t *testing.T) {
	handler := testServer(t)
	programme := request(t, handler, http.MethodGet, "/api/v1/launch-bharat", nil, "")
	if programme.Code != http.StatusOK {
		t.Fatalf("programme: got %d body=%s", programme.Code, programme.Body.String())
	}
	colleges := request(t, handler, http.MethodGet, "/api/v1/colleges", nil, "")
	collegeList := decodeBody[struct {
		Items []College `json:"items"`
	}](t, colleges)
	if len(collegeList.Items) == 0 {
		t.Fatal("seed has no institutions")
	}
	application := map[string]any{
		"collegeId": collegeList.Items[0].ID, "teamName": "Campus Builders", "ventureName": "QueueLess",
		"consent": true, "termsAccepted": true, "privacyAccepted": true,
		"password":     "A-secure-portal-password",
		"summary":      "A campus operations tool that validates demand and reduces long queues for student services.",
		"pitchDeckUrl": "https://example.com/deck", "prototypeUrl": "https://example.com/demo",
		"members": []map[string]any{
			{"fullName": "Aditi Rao", "email": "aditi@example.com", "phone": "9876543210", "course": "B.Tech", "yearOfStudy": "3rd year", "role": "founder", "isLead": true},
			{"fullName": "Kabir Shah", "email": "kabir@example.com", "phone": "9876543211", "course": "B.Tech", "yearOfStudy": "3rd year", "role": "cofounder", "isLead": false},
		},
	}
	created := request(t, handler, http.MethodPost, "/api/v1/launch-bharat/applications", application, "")
	if created.Code != http.StatusCreated {
		t.Fatalf("application: got %d body=%s", created.Code, created.Body.String())
	}
	duplicate := request(t, handler, http.MethodPost, "/api/v1/launch-bharat/applications", application, "")
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("duplicate application: got %d", duplicate.Code)
	}
	auth := loginToken(t, handler)
	workspaceResponse := request(t, handler, http.MethodGet, "/api/v1/admin/launch-bharat", nil, auth)
	if workspaceResponse.Code != http.StatusOK {
		t.Fatalf("workspace: got %d body=%s", workspaceResponse.Code, workspaceResponse.Body.String())
	}
	workspace := decodeBody[struct {
		Teams []LaunchTeamForTest `json:"teams"`
	}](t, workspaceResponse)
	if len(workspace.Teams) != 1 {
		t.Fatalf("got %d teams, want 1", len(workspace.Teams))
	}
	teamID := workspace.Teams[0].ID
	stage := request(t, handler, http.MethodPut, "/api/v1/admin/launch-bharat/teams/"+strconv.FormatInt(teamID, 10)+"/stage", map[string]string{"stage": "eligible"}, auth)
	if stage.Code != http.StatusOK {
		t.Fatalf("stage: got %d body=%s", stage.Code, stage.Body.String())
	}
	evaluation := request(t, handler, http.MethodPost, "/api/v1/admin/launch-bharat/teams/"+strconv.FormatInt(teamID, 10)+"/evaluations", map[string]any{"round": "screening", "innovationScore": 8, "feasibilityScore": 7, "impactScore": 8, "presentationScore": 7, "notes": "Proceed to campus review"}, auth)
	if evaluation.Code != http.StatusOK {
		t.Fatalf("evaluation: got %d body=%s", evaluation.Code, evaluation.Body.String())
	}
}

type LaunchTeamForTest struct {
	ID int64 `json:"id"`
}
