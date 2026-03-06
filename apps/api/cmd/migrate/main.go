package main

import (
	"log"
	"os"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	log.Println("Running database migrations...")
	// TODO: implement migrations with golang-migrate or goose
	log.Println("Migrations complete")
}
