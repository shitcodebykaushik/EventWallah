package main

import (
	"context"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
)

func main() {
	filePath := flag.String("file", "", "CSV file with institution records")
	dbPath := flag.String("db", "./data/eventwallah.db", "SQLite database path")
	flag.Parse()
	if *filePath == "" {
		log.Fatal("provide -file with a CSV path")
	}
	file, err := os.Open(*filePath)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	db, err := store.Open(*dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	header, err := reader.Read()
	if err != nil {
		log.Fatal(err)
	}
	columns := map[string]int{}
	for index, name := range header {
		columns[strings.ToLower(strings.TrimSpace(name))] = index
	}
	required := []string{"name", "institution_type", "ownership", "city", "state"}
	for _, name := range required {
		if _, ok := columns[name]; !ok {
			log.Fatalf("missing required column %q", name)
		}
	}

	value := func(record []string, name string) string {
		index, ok := columns[name]
		if !ok || index >= len(record) {
			return ""
		}
		return strings.TrimSpace(record[index])
	}
	ctx := context.Background()
	transaction, err := db.DB.BeginTx(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer transaction.Rollback()
	imported := 0
	for line := 2; ; line++ {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatalf("line %d: %v", line, err)
		}
		name := value(record, "name")
		if name == "" {
			continue
		}
		slug := value(record, "slug")
		if slug == "" {
			slug = store.Slugify(name)
		}
		_, err = transaction.ExecContext(ctx, `
			INSERT INTO colleges (slug,name,short_name,institution_type,ownership,city,state,website,logo_url)
			VALUES (?,?,?,?,?,?,?,?,?)
			ON CONFLICT(slug) DO UPDATE SET name=excluded.name,short_name=excluded.short_name,
			institution_type=excluded.institution_type,ownership=excluded.ownership,city=excluded.city,
			state=excluded.state,website=excluded.website,logo_url=excluded.logo_url`,
			slug, name, value(record, "short_name"), strings.ToLower(value(record, "institution_type")),
			strings.ToLower(value(record, "ownership")), value(record, "city"), value(record, "state"),
			value(record, "website"), value(record, "logo_url"))
		if err != nil {
			log.Fatalf("line %d (%s): %v", line, name, err)
		}
		imported++
	}
	if err := transaction.Commit(); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Imported or updated %d institutions\n", imported)
}
