package httpapi

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
)

type TicketType struct {
	ID           int64  `json:"id"`
	EventID      int64  `json:"eventId"`
	EventTitle   string `json:"eventTitle,omitempty"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	PricePaise   int    `json:"pricePaise"`
	Capacity     int    `json:"capacity"`
	SoldQuantity int    `json:"soldQuantity"`
	MinPerOrder  int    `json:"minPerOrder"`
	MaxPerOrder  int    `json:"maxPerOrder"`
	SalesStart   string `json:"salesStart"`
	SalesEnd     string `json:"salesEnd"`
	Benefits     string `json:"benefits"`
	Status       string `json:"status"`
}
type Sponsor struct {
	ID              int64  `json:"id"`
	Name            string `json:"name"`
	Industry        string `json:"industry"`
	Website         string `json:"website"`
	ContactName     string `json:"contactName"`
	ContactEmail    string `json:"contactEmail"`
	ContactPhone    string `json:"contactPhone"`
	Notes           string `json:"notes"`
	Status          string `json:"status"`
	DealCount       int    `json:"dealCount"`
	ContractedPaise int    `json:"contractedPaise"`
}
type Deliverable struct {
	ID          int64   `json:"id"`
	DealID      int64   `json:"dealId"`
	Title       string  `json:"title"`
	OwnerName   string  `json:"ownerName"`
	DueAt       *string `json:"dueAt"`
	Status      string  `json:"status"`
	EvidenceURL string  `json:"evidenceUrl"`
	CompletedAt *string `json:"completedAt"`
}
type Deal struct {
	ID                   int64         `json:"id"`
	EventID              int64         `json:"eventId"`
	EventTitle           string        `json:"eventTitle"`
	SponsorID            int64         `json:"sponsorId"`
	SponsorName          string        `json:"sponsorName"`
	PackageID            *int64        `json:"packageId"`
	PackageName          *string       `json:"packageName"`
	Stage                string        `json:"stage"`
	ContractedValuePaise int           `json:"contractedValuePaise"`
	CashValuePaise       int           `json:"cashValuePaise"`
	InKindValuePaise     int           `json:"inKindValuePaise"`
	ReceivedPaise        int           `json:"receivedPaise"`
	OwnerName            string        `json:"ownerName"`
	NextAction           string        `json:"nextAction"`
	NextActionAt         *string       `json:"nextActionAt"`
	Notes                string        `json:"notes"`
	Deliverables         []Deliverable `json:"deliverables"`
}

func nullableInt(value sql.NullInt64) any {
	if !value.Valid {
		return nil
	}
	return value.Int64
}

func (s *Server) adminScope(r *http.Request) (adminID, organizationID int64, role string, err error) {
	identity, ok := r.Context().Value(adminContextKey{}).(map[string]any)
	if !ok {
		return 0, 0, "", errors.New("missing identity")
	}
	adminID, ok = identity["id"].(int64)
	if !ok {
		return 0, 0, "", errors.New("invalid identity")
	}
	err = s.store.DB.QueryRowContext(r.Context(), `SELECT om.organization_id,om.role FROM organization_members om WHERE om.admin_id=? AND om.status='active' ORDER BY CASE om.role WHEN 'owner' THEN 0 ELSE 1 END LIMIT 1`, adminID).Scan(&organizationID, &role)
	return
}

func (s *Server) roles(next http.Handler, allowed ...string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _, role, err := s.adminScope(r)
		if err != nil {
			fail(w, http.StatusForbidden, "organization access required")
			return
		}
		for _, candidate := range allowed {
			if role == candidate {
				next.ServeHTTP(w, r)
				return
			}
		}
		fail(w, http.StatusForbidden, "your organization role cannot perform this action")
	})
}

func (s *Server) audit(r *http.Request, action, entityType string, entityID any, metadata string) {
	adminID, orgID, _, err := s.adminScope(r)
	if err != nil {
		return
	}
	_, _ = s.store.DB.ExecContext(r.Context(), `INSERT INTO audit_logs(organization_id,admin_id,action,entity_type,entity_id,metadata) VALUES(?,?,?,?,?,?)`, orgID, adminID, action, entityType, fmt.Sprint(entityID), metadata)
}

func scanTicket(row interface{ Scan(...any) error }) (TicketType, error) {
	var t TicketType
	err := row.Scan(&t.ID, &t.EventID, &t.EventTitle, &t.Name, &t.Description, &t.PricePaise, &t.Capacity, &t.SoldQuantity, &t.MinPerOrder, &t.MaxPerOrder, &t.SalesStart, &t.SalesEnd, &t.Benefits, &t.Status)
	return t, err
}

const ticketSelect = `SELECT t.id,t.event_id,e.title,t.name,t.description,t.price_paise,t.capacity,t.sold_quantity,t.min_per_order,t.max_per_order,t.sales_start,t.sales_end,t.benefits,t.status FROM ticket_types t JOIN events e ON e.id=t.event_id`

func (s *Server) publicTickets(w http.ResponseWriter, r *http.Request) {
	rows, err := s.store.DB.QueryContext(r.Context(), ticketSelect+` WHERE e.slug=? AND e.status='published' AND t.status='active' ORDER BY t.price_paise,t.id`, r.PathValue("slug"))
	if err != nil {
		fail(w, 500, "could not load tickets")
		return
	}
	defer rows.Close()
	items := []TicketType{}
	for rows.Next() {
		x, err := scanTicket(rows)
		if err != nil {
			fail(w, 500, "could not read tickets")
			return
		}
		items = append(items, x)
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) adminTickets(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	eventID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid event id")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), ticketSelect+` JOIN organization_events oe ON oe.event_id=e.id WHERE t.event_id=? AND oe.organization_id=? ORDER BY t.price_paise,t.id`, eventID, orgID)
	if err != nil {
		fail(w, 500, "could not load tickets")
		return
	}
	defer rows.Close()
	items := []TicketType{}
	for rows.Next() {
		x, err := scanTicket(rows)
		if err != nil {
			fail(w, 500, "could not read tickets")
			return
		}
		items = append(items, x)
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}

type ticketInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	PricePaise  int    `json:"pricePaise"`
	Capacity    int    `json:"capacity"`
	MinPerOrder int    `json:"minPerOrder"`
	MaxPerOrder int    `json:"maxPerOrder"`
	SalesStart  string `json:"salesStart"`
	SalesEnd    string `json:"salesEnd"`
	Benefits    string `json:"benefits"`
	Status      string `json:"status"`
}

func validateTicket(in *ticketInput) error {
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" || in.PricePaise < 0 || in.Capacity < 1 {
		return errors.New("name, non-negative price and capacity are required")
	}
	if in.MinPerOrder < 1 {
		in.MinPerOrder = 1
	}
	if in.MaxPerOrder < in.MinPerOrder {
		in.MaxPerOrder = in.MinPerOrder
	}
	start, e1 := time.Parse(time.RFC3339, in.SalesStart)
	end, e2 := time.Parse(time.RFC3339, in.SalesEnd)
	if e1 != nil || e2 != nil || !end.After(start) {
		return errors.New("provide a valid sales window")
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	if in.Benefits == "" {
		in.Benefits = "[]"
	}
	return nil
}
func (s *Server) createTicket(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	eventID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid event id")
		return
	}
	var in ticketInput
	if decode(r, &in) != nil {
		fail(w, 400, "invalid ticket details")
		return
	}
	if err = validateTicket(&in); err != nil {
		fail(w, 422, err.Error())
		return
	}
	var ownsEvent int
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM organization_events WHERE organization_id=? AND event_id=?`, orgID, eventID).Scan(&ownsEvent); err != nil || ownsEvent == 0 {
		fail(w, 404, "event not found")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO ticket_types(event_id,name,description,price_paise,capacity,min_per_order,max_per_order,sales_start,sales_end,benefits,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)`, eventID, in.Name, in.Description, in.PricePaise, in.Capacity, in.MinPerOrder, in.MaxPerOrder, in.SalesStart, in.SalesEnd, in.Benefits, in.Status)
	if err != nil {
		fail(w, 422, "could not create ticket type")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "ticket.created", "ticket_type", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) updateTicket(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid ticket id")
		return
	}
	var in ticketInput
	if decode(r, &in) != nil {
		fail(w, 400, "invalid ticket details")
		return
	}
	if err = validateTicket(&in); err != nil {
		fail(w, 422, err.Error())
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `UPDATE ticket_types SET name=?,description=?,price_paise=?,capacity=?,min_per_order=?,max_per_order=?,sales_start=?,sales_end=?,benefits=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND capacity>=sold_quantity AND event_id IN (SELECT event_id FROM organization_events WHERE organization_id=?)`, in.Name, in.Description, in.PricePaise, in.Capacity, in.MinPerOrder, in.MaxPerOrder, in.SalesStart, in.SalesEnd, in.Benefits, in.Status, id, orgID)
	if err != nil {
		fail(w, 422, "could not update ticket type")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		fail(w, 404, "ticket type not found or capacity is below sold inventory")
		return
	}
	s.audit(r, "ticket.updated", "ticket_type", id, `{}`)
	writeJSON(w, 200, map[string]any{"id": id, "updated": true})
}

func orderRef() string {
	raw, _ := randomToken(7)
	return "EWO-" + strings.ToUpper(strings.ReplaceAll(raw, "-", ""))[:9]
}
func (s *Server) createOrder(w http.ResponseWriter, r *http.Request) {
	var in struct {
		TicketTypeID int64  `json:"ticketTypeId"`
		Quantity     int    `json:"quantity"`
		CouponCode   string `json:"couponCode"`
		FullName     string `json:"fullName"`
		Email        string `json:"email"`
		Phone        string `json:"phone"`
		CollegeName  string `json:"collegeName"`
		Course       string `json:"course"`
		YearOfStudy  string `json:"yearOfStudy"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid order details")
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Quantity < 1 || in.FullName == "" || !strings.Contains(in.Email, "@") || len(in.Phone) < 10 {
		fail(w, 422, "complete all attendee and ticket details")
		return
	}
	tx, err := s.store.DB.BeginTx(r.Context(), nil)
	if err != nil {
		fail(w, 500, "checkout unavailable")
		return
	}
	defer tx.Rollback()
	var eventID int64
	var eventTitle, ticketName, status, salesStart, salesEnd string
	var price, capacity, sold, minQty, maxQty int
	err = tx.QueryRowContext(r.Context(), `SELECT e.id,e.title,t.name,t.status,t.sales_start,t.sales_end,t.price_paise,t.capacity,t.sold_quantity,t.min_per_order,t.max_per_order FROM ticket_types t JOIN events e ON e.id=t.event_id WHERE t.id=? AND e.slug=? AND e.status='published'`, in.TicketTypeID, r.PathValue("slug")).Scan(&eventID, &eventTitle, &ticketName, &status, &salesStart, &salesEnd, &price, &capacity, &sold, &minQty, &maxQty)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "ticket type not found")
		return
	}
	if err != nil {
		fail(w, 500, "checkout unavailable")
		return
	}
	now := time.Now()
	start, _ := time.Parse(time.RFC3339, salesStart)
	end, _ := time.Parse(time.RFC3339, salesEnd)
	if status != "active" || now.Before(start) || now.After(end) {
		fail(w, 409, "ticket sales are not open")
		return
	}
	if in.Quantity < minQty || in.Quantity > maxQty {
		fail(w, 422, fmt.Sprintf("quantity must be between %d and %d", minQty, maxQty))
		return
	}
	if sold+in.Quantity > capacity {
		fail(w, 409, "not enough tickets are available")
		return
	}
	subtotal := price * in.Quantity
	discount := 0
	var couponID any = nil
	if code := strings.ToUpper(strings.TrimSpace(in.CouponCode)); code != "" {
		var id int64
		var kind, couponStatus, cStart, cEnd string
		var value, minOrder, used int
		var maxDiscount, limit sql.NullInt64
		err = tx.QueryRowContext(r.Context(), `SELECT id,discount_type,discount_value,max_discount_paise,minimum_order_paise,usage_limit,used_count,starts_at,ends_at,status FROM coupons WHERE code=? AND (event_id IS NULL OR event_id=?)`, code, eventID).Scan(&id, &kind, &value, &maxDiscount, &minOrder, &limit, &used, &cStart, &cEnd, &couponStatus)
		if err != nil {
			fail(w, 422, "coupon is invalid")
			return
		}
		cs, _ := time.Parse(time.RFC3339, cStart)
		ce, _ := time.Parse(time.RFC3339, cEnd)
		if couponStatus != "active" || now.Before(cs) || now.After(ce) || (limit.Valid && used >= int(limit.Int64)) || subtotal < minOrder {
			fail(w, 422, "coupon is not applicable")
			return
		}
		if kind == "percentage" {
			discount = subtotal * value / 100
		} else {
			discount = value
		}
		if maxDiscount.Valid && discount > int(maxDiscount.Int64) {
			discount = int(maxDiscount.Int64)
		}
		if discount > subtotal {
			discount = subtotal
		}
		couponID = id
	}
	total := subtotal - discount
	paymentStatus := "not_required"
	orderStatus := "confirmed"
	if total > 0 {
		paymentStatus = "pending"
		orderStatus = "pending"
	}
	ref := orderRef()
	res, err := tx.ExecContext(r.Context(), `INSERT INTO orders(public_id,event_id,buyer_name,buyer_email,buyer_phone,subtotal_paise,discount_paise,total_paise,coupon_id,status,payment_status) VALUES(?,?,?,?,?,?,?,?,?,?,?)`, ref, eventID, in.FullName, in.Email, in.Phone, subtotal, discount, total, couponID, orderStatus, paymentStatus)
	if err != nil {
		fail(w, 500, "could not create order")
		return
	}
	orderID, _ := res.LastInsertId()
	if _, err = tx.ExecContext(r.Context(), `INSERT INTO order_items(order_id,ticket_type_id,quantity,unit_price_paise,line_total_paise) VALUES(?,?,?,?,?)`, orderID, in.TicketTypeID, in.Quantity, price, subtotal); err != nil {
		fail(w, 500, "could not create order items")
		return
	}
	if total > 0 {
		if err = tx.Commit(); err != nil {
			fail(w, 500, "could not create order")
			return
		}
		writeJSON(w, 201, map[string]any{"orderId": ref, "status": "pending", "paymentRequired": true, "amountPaise": total, "message": "Payment provider configuration is required to complete this order"})
		return
	}
	if in.Quantity != 1 {
		fail(w, 422, "free student passes currently require one attendee per order")
		return
	}
	token, _ := randomToken(24)
	publicRaw, _ := randomToken(6)
	publicID := "EW-" + strings.ToUpper(strings.ReplaceAll(publicRaw, "-", ""))[:8]
	regRes, err := tx.ExecContext(r.Context(), `INSERT INTO registrations(public_id,event_id,full_name,email,phone,college_name,course,year_of_study,pass_token) VALUES(?,?,?,?,?,?,?,?,?)`, publicID, eventID, in.FullName, in.Email, in.Phone, in.CollegeName, in.Course, in.YearOfStudy, token)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			fail(w, 409, "this email is already registered for the event")
			return
		}
		fail(w, 500, "could not issue pass")
		return
	}
	regID, _ := regRes.LastInsertId()
	_, _ = tx.ExecContext(r.Context(), `UPDATE ticket_types SET sold_quantity=sold_quantity+? WHERE id=?`, in.Quantity, in.TicketTypeID)
	if couponID != nil {
		_, _ = tx.ExecContext(r.Context(), `UPDATE coupons SET used_count=used_count+1 WHERE id=?`, couponID)
	}
	if err = tx.Commit(); err != nil {
		fail(w, 500, "could not confirm order")
		return
	}
	writeJSON(w, 201, map[string]any{"orderId": ref, "status": "confirmed", "paymentRequired": false, "registration": Registration{ID: regID, PublicID: publicID, EventID: eventID, EventTitle: eventTitle, FullName: in.FullName, Email: in.Email, Phone: in.Phone, CollegeName: in.CollegeName, Course: in.Course, YearOfStudy: in.YearOfStudy, PassToken: token, Status: "confirmed", QRURL: "/api/v1/passes/" + token + "/qr", PassURL: s.webURL + "/pass/" + token}, "ticketName": ticketName})
}

func (s *Server) listOrders(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT o.id,o.public_id,e.title,o.buyer_name,o.buyer_email,o.subtotal_paise,o.discount_paise,o.total_paise,o.status,o.payment_status,o.created_at FROM orders o JOIN events e ON e.id=o.event_id JOIN organization_events oe ON oe.event_id=e.id WHERE oe.organization_id=? ORDER BY o.created_at DESC LIMIT 250`, orgID)
	if err != nil {
		fail(w, 500, "could not load orders")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var ref, event, name, email, status, payment, created string
		var subtotal, discount, total int
		if rows.Scan(&id, &ref, &event, &name, &email, &subtotal, &discount, &total, &status, &payment, &created) != nil {
			fail(w, 500, "could not read orders")
			return
		}
		items = append(items, map[string]any{"id": id, "publicId": ref, "eventTitle": event, "buyerName": name, "buyerEmail": email, "subtotalPaise": subtotal, "discountPaise": discount, "totalPaise": total, "status": status, "paymentStatus": payment, "createdAt": created})
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}

func (s *Server) listCoupons(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT c.id,c.event_id,e.title,c.code,c.discount_type,c.discount_value,c.max_discount_paise,c.minimum_order_paise,c.usage_limit,c.used_count,c.starts_at,c.ends_at,c.status FROM coupons c JOIN events e ON e.id=c.event_id JOIN organization_events oe ON oe.event_id=e.id WHERE oe.organization_id=? ORDER BY c.created_at DESC`, orgID)
	if err != nil {
		fail(w, 500, "could not load coupons")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var eventID, maxDiscount, limit sql.NullInt64
		var event, code, kind, start, end, status string
		var value, minOrder, used int
		if rows.Scan(&id, &eventID, &event, &code, &kind, &value, &maxDiscount, &minOrder, &limit, &used, &start, &end, &status) != nil {
			fail(w, 500, "could not read coupons")
			return
		}
		items = append(items, map[string]any{"id": id, "eventId": nullableInt(eventID), "eventTitle": event, "code": code, "discountType": kind, "discountValue": value, "maxDiscountPaise": nullableInt(maxDiscount), "minimumOrderPaise": minOrder, "usageLimit": nullableInt(limit), "usedCount": used, "startsAt": start, "endsAt": end, "status": status})
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) createCoupon(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in struct {
		EventID           *int64 `json:"eventId"`
		Code              string `json:"code"`
		DiscountType      string `json:"discountType"`
		DiscountValue     int    `json:"discountValue"`
		MaxDiscountPaise  *int   `json:"maxDiscountPaise"`
		MinimumOrderPaise int    `json:"minimumOrderPaise"`
		UsageLimit        *int   `json:"usageLimit"`
		StartsAt          string `json:"startsAt"`
		EndsAt            string `json:"endsAt"`
	}
	if decode(r, &in) != nil || in.DiscountValue < 1 || in.EventID == nil {
		fail(w, 422, "complete coupon details")
		return
	}
	code := strings.ToUpper(strings.TrimSpace(in.Code))
	if code == "" || (in.DiscountType != "percentage" && in.DiscountType != "fixed") {
		fail(w, 422, "provide a code and valid discount type")
		return
	}
	if in.DiscountType == "percentage" && in.DiscountValue > 100 {
		fail(w, 422, "percentage cannot exceed 100")
		return
	}
	start, startErr := time.Parse(time.RFC3339, in.StartsAt)
	end, endErr := time.Parse(time.RFC3339, in.EndsAt)
	if startErr != nil || endErr != nil || !end.After(start) || (in.UsageLimit != nil && *in.UsageLimit < 1) {
		fail(w, 422, "provide a valid coupon window and usage limit")
		return
	}
	var ownsEvent int
	if err := s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM organization_events WHERE organization_id=? AND event_id=?`, orgID, *in.EventID).Scan(&ownsEvent); err != nil || ownsEvent == 0 {
		fail(w, 404, "event not found")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO coupons(event_id,code,discount_type,discount_value,max_discount_paise,minimum_order_paise,usage_limit,starts_at,ends_at) VALUES(?,?,?,?,?,?,?,?,?)`, in.EventID, code, in.DiscountType, in.DiscountValue, in.MaxDiscountPaise, in.MinimumOrderPaise, in.UsageLimit, in.StartsAt, in.EndsAt)
	if err != nil {
		fail(w, 422, "coupon code already exists or is invalid")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "coupon.created", "coupon", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id, "code": code})
}

func (s *Server) listSponsors(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT s.id,s.name,s.industry,s.website,s.contact_name,s.contact_email,s.contact_phone,s.notes,s.status,COUNT(d.id),COALESCE(SUM(d.contracted_value_paise),0) FROM sponsors s LEFT JOIN sponsorship_deals d ON d.sponsor_id=s.id WHERE s.organization_id=? GROUP BY s.id ORDER BY s.name`, orgID)
	if err != nil {
		fail(w, 500, "could not load sponsors")
		return
	}
	defer rows.Close()
	items := []Sponsor{}
	for rows.Next() {
		var x Sponsor
		if rows.Scan(&x.ID, &x.Name, &x.Industry, &x.Website, &x.ContactName, &x.ContactEmail, &x.ContactPhone, &x.Notes, &x.Status, &x.DealCount, &x.ContractedPaise) != nil {
			fail(w, 500, "could not read sponsors")
			return
		}
		items = append(items, x)
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) createSponsor(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in struct {
		Name         string `json:"name"`
		Industry     string `json:"industry"`
		Website      string `json:"website"`
		ContactName  string `json:"contactName"`
		ContactEmail string `json:"contactEmail"`
		ContactPhone string `json:"contactPhone"`
		Notes        string `json:"notes"`
	}
	if decode(r, &in) != nil || strings.TrimSpace(in.Name) == "" || !strings.Contains(in.ContactEmail, "@") {
		fail(w, 422, "brand name and valid contact are required")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO sponsors(organization_id,name,industry,website,contact_name,contact_email,contact_phone,notes) VALUES(?,?,?,?,?,?,?,?)`, orgID, in.Name, in.Industry, in.Website, in.ContactName, in.ContactEmail, in.ContactPhone, in.Notes)
	if err != nil {
		fail(w, 422, "sponsor already exists or is invalid")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "sponsor.created", "sponsor", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}

func scanDeal(row interface{ Scan(...any) error }) (Deal, error) {
	var x Deal
	err := row.Scan(&x.ID, &x.EventID, &x.EventTitle, &x.SponsorID, &x.SponsorName, &x.PackageID, &x.PackageName, &x.Stage, &x.ContractedValuePaise, &x.CashValuePaise, &x.InKindValuePaise, &x.ReceivedPaise, &x.OwnerName, &x.NextAction, &x.NextActionAt, &x.Notes)
	x.Deliverables = []Deliverable{}
	return x, err
}

const dealSelect = `SELECT d.id,d.event_id,e.title,d.sponsor_id,s.name,d.package_id,p.name,d.stage,d.contracted_value_paise,d.cash_value_paise,d.in_kind_value_paise,d.received_paise,d.owner_name,d.next_action,d.next_action_at,d.notes FROM sponsorship_deals d JOIN events e ON e.id=d.event_id JOIN sponsors s ON s.id=d.sponsor_id LEFT JOIN sponsorship_packages p ON p.id=d.package_id`

func (s *Server) listDeals(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), dealSelect+` WHERE d.organization_id=? ORDER BY d.updated_at DESC`, orgID)
	if err != nil {
		fail(w, 500, "could not load deals")
		return
	}
	items := []Deal{}
	for rows.Next() {
		x, err := scanDeal(rows)
		if err != nil {
			fail(w, 500, "could not read deals")
			return
		}
		items = append(items, x)
	}
	if err = rows.Close(); err != nil {
		fail(w, 500, "could not finish reading deals")
		return
	}
	// The store intentionally uses a single SQLite connection. Close the parent
	// cursor before loading child rows so the request cannot wait on itself.
	for i := range items {
		drows, queryErr := s.store.DB.QueryContext(r.Context(), `SELECT id,deal_id,title,owner_name,due_at,status,evidence_url,completed_at FROM sponsorship_deliverables WHERE deal_id=? ORDER BY id`, items[i].ID)
		if queryErr == nil {
			for drows.Next() {
				var d Deliverable
				if drows.Scan(&d.ID, &d.DealID, &d.Title, &d.OwnerName, &d.DueAt, &d.Status, &d.EvidenceURL, &d.CompletedAt) == nil {
					items[i].Deliverables = append(items[i].Deliverables, d)
				}
			}
			drows.Close()
		}
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}

type dealInput struct {
	EventID              int64   `json:"eventId"`
	SponsorID            int64   `json:"sponsorId"`
	PackageID            *int64  `json:"packageId"`
	Stage                string  `json:"stage"`
	ContractedValuePaise int     `json:"contractedValuePaise"`
	CashValuePaise       int     `json:"cashValuePaise"`
	InKindValuePaise     int     `json:"inKindValuePaise"`
	ReceivedPaise        int     `json:"receivedPaise"`
	OwnerName            string  `json:"ownerName"`
	NextAction           string  `json:"nextAction"`
	NextActionAt         *string `json:"nextActionAt"`
	Notes                string  `json:"notes"`
}

func (s *Server) createDeal(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in dealInput
	if decode(r, &in) != nil || in.EventID < 1 || in.SponsorID < 1 {
		fail(w, 422, "event and sponsor are required")
		return
	}
	if in.Stage == "" {
		in.Stage = "prospect"
	}
	if in.ContractedValuePaise < 0 || in.CashValuePaise < 0 || in.InKindValuePaise < 0 || in.ReceivedPaise < 0 || in.ReceivedPaise > in.CashValuePaise {
		fail(w, 422, "deal values must be non-negative and received cash cannot exceed cash value")
		return
	}
	var allowed int
	if err = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM organization_events oe JOIN sponsors s ON s.organization_id=oe.organization_id WHERE oe.organization_id=? AND oe.event_id=? AND s.id=?`, orgID, in.EventID, in.SponsorID).Scan(&allowed); err != nil || allowed == 0 {
		fail(w, 422, "event and sponsor must belong to your organization")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO sponsorship_deals(organization_id,event_id,sponsor_id,package_id,stage,contracted_value_paise,cash_value_paise,in_kind_value_paise,received_paise,owner_name,next_action,next_action_at,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, orgID, in.EventID, in.SponsorID, in.PackageID, in.Stage, in.ContractedValuePaise, in.CashValuePaise, in.InKindValuePaise, in.ReceivedPaise, in.OwnerName, in.NextAction, in.NextActionAt, in.Notes)
	if err != nil {
		fail(w, 422, "could not create sponsorship deal")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "sponsorship.created", "sponsorship_deal", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) updateDeal(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid deal id")
		return
	}
	var in dealInput
	if decode(r, &in) != nil {
		fail(w, 400, "invalid deal details")
		return
	}
	if in.ContractedValuePaise < 0 || in.CashValuePaise < 0 || in.InKindValuePaise < 0 || in.ReceivedPaise < 0 || in.ReceivedPaise > in.CashValuePaise {
		fail(w, 422, "deal values must be non-negative and received cash cannot exceed cash value")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `UPDATE sponsorship_deals SET event_id=?,sponsor_id=?,package_id=?,stage=?,contracted_value_paise=?,cash_value_paise=?,in_kind_value_paise=?,received_paise=?,owner_name=?,next_action=?,next_action_at=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND organization_id=?`, in.EventID, in.SponsorID, in.PackageID, in.Stage, in.ContractedValuePaise, in.CashValuePaise, in.InKindValuePaise, in.ReceivedPaise, in.OwnerName, in.NextAction, in.NextActionAt, in.Notes, id, orgID)
	if err != nil {
		fail(w, 422, "could not update deal")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		fail(w, 404, "deal not found")
		return
	}
	s.audit(r, "sponsorship.updated", "sponsorship_deal", id, `{}`)
	writeJSON(w, 200, map[string]any{"id": id, "updated": true})
}
func (s *Server) createDeliverable(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	dealID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid deal id")
		return
	}
	var in struct {
		Title     string  `json:"title"`
		OwnerName string  `json:"ownerName"`
		DueAt     *string `json:"dueAt"`
	}
	if decode(r, &in) != nil || strings.TrimSpace(in.Title) == "" {
		fail(w, 422, "deliverable title is required")
		return
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO sponsorship_deliverables(deal_id,title,owner_name,due_at) SELECT id,?,?,? FROM sponsorship_deals WHERE id=? AND organization_id=?`, in.Title, in.OwnerName, in.DueAt, dealID, orgID)
	if err != nil {
		fail(w, 422, "could not add deliverable")
		return
	}
	id, _ := res.LastInsertId()
	affected, _ := res.RowsAffected()
	if affected == 0 {
		fail(w, 404, "deal not found")
		return
	}
	s.audit(r, "deliverable.created", "sponsorship_deliverable", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) updateDeliverable(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, scopeErr := s.adminScope(r)
	if scopeErr != nil {
		fail(w, 403, "organization access required")
		return
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 400, "invalid deliverable id")
		return
	}
	var in struct {
		Status      string `json:"status"`
		EvidenceURL string `json:"evidenceUrl"`
	}
	if decode(r, &in) != nil {
		fail(w, 400, "invalid deliverable details")
		return
	}
	completed := any(nil)
	if in.Status == "completed" {
		completed = store.Now()
	}
	res, err := s.store.DB.ExecContext(r.Context(), `UPDATE sponsorship_deliverables SET status=?,evidence_url=?,completed_at=? WHERE id=? AND deal_id IN (SELECT id FROM sponsorship_deals WHERE organization_id=?)`, in.Status, in.EvidenceURL, completed, id, orgID)
	if err != nil {
		fail(w, 422, "could not update deliverable")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		fail(w, 404, "deliverable not found")
		return
	}
	s.audit(r, "deliverable.updated", "sponsorship_deliverable", id, `{}`)
	writeJSON(w, 200, map[string]any{"id": id, "updated": true})
}

func (s *Server) financeSummary(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var ticketGross, ticketDiscount, ticketCollected, sponsorContracted, sponsorReceived, expenses int
	s.store.DB.QueryRowContext(r.Context(), `SELECT COALESCE(SUM(o.subtotal_paise),0),COALESCE(SUM(o.discount_paise),0),COALESCE(SUM(CASE WHEN o.status='confirmed' THEN o.total_paise ELSE 0 END),0) FROM orders o JOIN organization_events oe ON oe.event_id=o.event_id WHERE oe.organization_id=?`, orgID).Scan(&ticketGross, &ticketDiscount, &ticketCollected)
	s.store.DB.QueryRowContext(r.Context(), `SELECT COALESCE(SUM(contracted_value_paise),0),COALESCE(SUM(received_paise),0) FROM sponsorship_deals WHERE organization_id=?`, orgID).Scan(&sponsorContracted, &sponsorReceived)
	s.store.DB.QueryRowContext(r.Context(), `SELECT COALESCE(SUM(amount_paise+tax_paise),0) FROM expenses WHERE organization_id=? AND payment_status!='void'`, orgID).Scan(&expenses)
	writeJSON(w, 200, map[string]any{"ticketGrossPaise": ticketGross, "ticketDiscountPaise": ticketDiscount, "ticketCollectedPaise": ticketCollected, "sponsorContractedPaise": sponsorContracted, "sponsorReceivedPaise": sponsorReceived, "sponsorOutstandingPaise": sponsorContracted - sponsorReceived, "expensesPaise": expenses, "netPositionPaise": ticketCollected + sponsorReceived - expenses})
}
func (s *Server) createExpense(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	var in struct {
		EventID       *int64 `json:"eventId"`
		Category      string `json:"category"`
		VendorName    string `json:"vendorName"`
		Description   string `json:"description"`
		AmountPaise   int    `json:"amountPaise"`
		TaxPaise      int    `json:"taxPaise"`
		PaymentStatus string `json:"paymentStatus"`
		IncurredAt    string `json:"incurredAt"`
	}
	if decode(r, &in) != nil || in.Category == "" || in.VendorName == "" || in.AmountPaise < 0 {
		fail(w, 422, "complete expense details")
		return
	}
	if in.PaymentStatus == "" {
		in.PaymentStatus = "pending"
	}
	if _, err = time.Parse(time.RFC3339, in.IncurredAt); err != nil {
		fail(w, 422, "incurred date must use RFC3339 format")
		return
	}
	if in.EventID != nil {
		var ownsEvent int
		if err = s.store.DB.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM organization_events WHERE organization_id=? AND event_id=?`, orgID, *in.EventID).Scan(&ownsEvent); err != nil || ownsEvent == 0 {
			fail(w, 404, "event not found")
			return
		}
	}
	res, err := s.store.DB.ExecContext(r.Context(), `INSERT INTO expenses(organization_id,event_id,category,vendor_name,description,amount_paise,tax_paise,payment_status,incurred_at) VALUES(?,?,?,?,?,?,?,?,?)`, orgID, in.EventID, in.Category, in.VendorName, in.Description, in.AmountPaise, in.TaxPaise, in.PaymentStatus, in.IncurredAt)
	if err != nil {
		fail(w, 422, "could not record expense")
		return
	}
	id, _ := res.LastInsertId()
	s.audit(r, "expense.created", "expense", id, `{}`)
	writeJSON(w, 201, map[string]any{"id": id})
}
func (s *Server) listExpenses(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT x.id,x.event_id,COALESCE(e.title,'Organization'),x.category,x.vendor_name,x.description,x.amount_paise,x.tax_paise,x.payment_status,x.incurred_at,x.created_at FROM expenses x LEFT JOIN events e ON e.id=x.event_id WHERE x.organization_id=? ORDER BY x.incurred_at DESC,x.id DESC`, orgID)
	if err != nil {
		fail(w, 500, "could not load expenses")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var eventID sql.NullInt64
		var event, category, vendor, description, status, incurred, created string
		var amount, tax int
		if rows.Scan(&id, &eventID, &event, &category, &vendor, &description, &amount, &tax, &status, &incurred, &created) != nil {
			fail(w, 500, "could not read expenses")
			return
		}
		items = append(items, map[string]any{"id": id, "eventId": nullableInt(eventID), "eventTitle": event, "category": category, "vendorName": vendor, "description": description, "amountPaise": amount, "taxPaise": tax, "paymentStatus": status, "incurredAt": incurred, "createdAt": created})
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
func (s *Server) listAudit(w http.ResponseWriter, r *http.Request) {
	_, orgID, _, err := s.adminScope(r)
	if err != nil {
		fail(w, 403, "organization access required")
		return
	}
	rows, err := s.store.DB.QueryContext(r.Context(), `SELECT l.id,l.action,l.entity_type,l.entity_id,l.metadata,l.created_at,COALESCE(a.name,'System') FROM audit_logs l LEFT JOIN admins a ON a.id=l.admin_id WHERE l.organization_id=? ORDER BY l.created_at DESC LIMIT 250`, orgID)
	if err != nil {
		fail(w, 500, "could not load audit history")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id int64
		var action, entityType, entityID, metadata, created, actor string
		if rows.Scan(&id, &action, &entityType, &entityID, &metadata, &created, &actor) != nil {
			fail(w, 500, "could not read audit history")
			return
		}
		items = append(items, map[string]any{"id": id, "action": action, "entityType": entityType, "entityId": entityID, "metadata": metadata, "createdAt": created, "actorName": actor})
	}
	writeJSON(w, 200, map[string]any{"items": items, "count": len(items)})
}
