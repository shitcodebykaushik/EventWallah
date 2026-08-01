package store

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schema string

type Store struct{ DB *sql.DB }

func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate database: %w", err)
	}
	return &Store{DB: db}, nil
}

func (s *Store) Close() error { return s.DB.Close() }

func (s *Store) Seed(ctx context.Context, passwordHash string) error {
	var count int
	if err := s.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM colleges").Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		colleges := [][]string{
			{"indian-institute-of-technology-bombay", "Indian Institute of Technology Bombay", "IIT Bombay", "college", "government", "Mumbai", "Maharashtra", "https://www.iitb.ac.in"},
			{"university-of-delhi", "University of Delhi", "DU", "university", "government", "New Delhi", "Delhi", "https://www.du.ac.in"},
			{"christ-university-bengaluru", "CHRIST (Deemed to be University)", "CHRIST", "university", "deemed", "Bengaluru", "Karnataka", "https://christuniversity.in"},
			{"savitribai-phule-pune-university", "Savitribai Phule Pune University", "SPPU", "university", "government", "Pune", "Maharashtra", "http://www.unipune.ac.in"},
			{"vellore-institute-of-technology", "Vellore Institute of Technology", "VIT", "university", "private", "Vellore", "Tamil Nadu", "https://vit.ac.in"},
			{"jadavpur-university", "Jadavpur University", "JU", "university", "government", "Kolkata", "West Bengal", "https://jadavpuruniversity.in"},
			{"banaras-hindu-university", "Banaras Hindu University", "BHU", "university", "government", "Varanasi", "Uttar Pradesh", "https://www.bhu.ac.in"},
			{"manipal-academy-of-higher-education", "Manipal Academy of Higher Education", "MAHE", "university", "deemed", "Manipal", "Karnataka", "https://www.manipal.edu"},
		}
		for _, c := range colleges {
			if _, err := s.DB.ExecContext(ctx, `INSERT INTO colleges (slug,name,short_name,institution_type,ownership,city,state,website) VALUES (?,?,?,?,?,?,?,?)`, c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7]); err != nil {
				return err
			}
		}

		seeds := []struct {
			college, slug, title, category, summary, description, venue, start, end, deadline string
			capacity                                                                          int
			organizer, email                                                                  string
		}{
			{"indian-institute-of-technology-bombay", "techfest-open-house-2026", "Techfest Open House 2026", "Technology", "An evening of student prototypes, robotics demonstrations and open labs.", "Meet student technical teams, explore working prototypes and attend short demonstrations across the institute's innovation spaces.", "Students' Activity Centre", "2026-09-12T10:00:00+05:30", "2026-09-12T18:00:00+05:30", "2026-09-10T23:59:00+05:30", 600, "Techfest Student Team", "events@iitb.ac.in"},
			{"university-of-delhi", "north-campus-cultural-evening", "North Campus Cultural Evening", "Culture", "Music, theatre and dance performances from societies across North Campus.", "A student-led cultural programme featuring selected performances from participating colleges, followed by an informal society meet-up.", "University Stadium Conference Centre", "2026-09-20T16:00:00+05:30", "2026-09-20T21:00:00+05:30", "2026-09-18T18:00:00+05:30", 450, "DU Cultural Council", "culture@du.ac.in"},
			{"christ-university-bengaluru", "campus-founder-meet-2026", "Campus Founder Meet", "Entrepreneurship", "A practical meet-up for student founders, builders and campus incubator teams.", "Short founder sessions, product feedback tables and office hours with operators from Bengaluru's startup community.", "KE Auditorium, Central Campus", "2026-10-03T09:30:00+05:30", "2026-10-03T17:00:00+05:30", "2026-09-30T23:59:00+05:30", 300, "Innovation and Incubation Centre", "innovation@christuniversity.in"},
			{"vellore-institute-of-technology", "design-code-sprint", "Design × Code Sprint", "Hackathon", "A one-day team sprint to prototype useful tools for campus life.", "Multidisciplinary teams will choose a campus problem, validate it with users and present a working prototype to the review panel.", "Anna Auditorium", "2026-10-10T08:00:00+05:30", "2026-10-10T20:00:00+05:30", "2026-10-06T23:59:00+05:30", 240, "VIT Technology Club", "clubs@vit.ac.in"},
		}
		for _, e := range seeds {
			_, err := s.DB.ExecContext(ctx, `INSERT INTO events (college_id,slug,title,category,summary,description,venue,starts_at,ends_at,registration_deadline,capacity,status,organizer_name,contact_email) SELECT id,?,?,?,?,?,?,?,?,?,?,'published',?,? FROM colleges WHERE slug=?`, e.slug, e.title, e.category, e.summary, e.description, e.venue, e.start, e.end, e.deadline, e.capacity, e.organizer, e.email, e.college)
			if err != nil {
				return err
			}
		}
	}

	_, err := s.DB.ExecContext(ctx, `INSERT INTO admins (name,email,password_hash,role) VALUES (?,?,?,'super_admin') ON CONFLICT(email) DO NOTHING`, "EventWallah Admin", "admin@eventwallah.local", passwordHash)
	if err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `INSERT INTO organizations(slug,name,legal_name,email,phone) VALUES('eventwallah','EventWallah','The Event Wallah','info@theeventwallah.com','+91 9355214750') ON CONFLICT(slug) DO NOTHING`); err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `INSERT INTO organization_members(organization_id,admin_id,role) SELECT o.id,a.id,'owner' FROM organizations o,admins a WHERE o.slug='eventwallah' AND a.email='admin@eventwallah.local' ON CONFLICT DO NOTHING`); err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `INSERT INTO organization_events(organization_id,event_id) SELECT o.id,e.id FROM organizations o,events e WHERE o.slug='eventwallah' ON CONFLICT DO NOTHING`); err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `INSERT INTO ticket_types(event_id,name,description,price_paise,capacity,min_per_order,max_per_order,sales_start,sales_end,status) SELECT e.id,'Free Student Pass','General admission for one verified student',0,e.capacity,1,1,?,e.registration_deadline,'active' FROM events e WHERE NOT EXISTS(SELECT 1 FROM ticket_types t WHERE t.event_id=e.id)`, Now()); err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `UPDATE ticket_types SET sales_start=? WHERE instr(sales_start,'T')=0`, Now()); err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `INSERT INTO sponsors(organization_id,name,industry,website,contact_name,contact_email,status) SELECT o.id,'Campus Brew','Food & Beverage','https://example.com','Partnerships Team','partnerships@example.com','prospect' FROM organizations o WHERE o.slug='eventwallah' AND NOT EXISTS(SELECT 1 FROM sponsors s WHERE s.organization_id=o.id)`); err != nil {
		return err
	}
	if _, err = s.DB.ExecContext(ctx, `INSERT INTO sponsorship_packages(event_id,name,price_paise,description,inventory,status) SELECT e.id,'Title Partner',5000000,'Primary brand placement, stage mentions and digital visibility',1,'active' FROM events e WHERE NOT EXISTS(SELECT 1 FROM sponsorship_packages p WHERE p.event_id=e.id)`); err != nil {
		return err
	}
	return nil
}

func Slugify(value string) string {
	v := strings.ToLower(strings.TrimSpace(value))
	var b strings.Builder
	dash := false
	for _, r := range v {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			dash = false
		} else if !dash && b.Len() > 0 {
			b.WriteByte('-')
			dash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func Now() string { return time.Now().UTC().Format(time.RFC3339) }
