function fetchData() {
    // Existing code...
    return ongoingMatches.or(
        .contains('team_a_ids', [user.id])
        .or(`team_b_ids.cs.{${user.id}}`) // Updated from team_a and team_b
    );
}

function startMatch() {
    let insertPayload = {
        // Other keys remain unchanged...
        team_a_ids: team_a, // Updated
        team_b_ids: team_b  // Updated
        // Other keys remain unchanged...
    };
    // Additional logic...
}