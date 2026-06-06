package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func signUpAndSignIn(client *http.Client, gatewayURL string, simID int) (string, error) {
	email := fmt.Sprintf("simulated_%d_%d@example.com", simID, time.Now().UnixNano()%100000)
	password := "SecurePass123!"

	// 1. SignUp
	signUpPayload := map[string]string{
		"email":    email,
		"password": password,
		"role":     "customer",
	}
	if err := postJSON(client, gatewayURL+"/auth/signup", signUpPayload, "", nil); err != nil {
		return "", fmt.Errorf("signUp failed: %w", err)
	}
	log.Printf("[User-%d] Signed up as %s", simID, email)

	// 2. SignIn
	signInPayload := map[string]string{
		"email":    email,
		"password": password,
	}
	token := ""
	if err := postJSONAndGetCookie(client, gatewayURL+"/auth/signin", signInPayload, &token); err != nil {
		return "", fmt.Errorf("signIn failed: %w", err)
	}
	log.Printf("[User-%d] Logged in successfully", simID)

	return token, nil
}
