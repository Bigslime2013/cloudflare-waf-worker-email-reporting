import {
    EmailMessage
} from "cloudflare:email";
import {
    createMimeMessage
} from "mimetext";

export default {
    async scheduled(event, env) {
        console.log(JSON.stringify(env));

        const API_TOKEN = env.API_TOKEN;
        const ZONE_TAG = env.ZONE_TAG;
        const SENDER_EMAIL = "admin@socteam.com"; // Replace with your sender email
        const RECIPIENT_EMAIL = "alerts@socteam.com"; // Replace with your recipient email

        console.log("ZONE_TAG:", ZONE_TAG);

        if (!ZONE_TAG) {
            console.log("Error: ZONE_TAG is not set", {
                status: 400
            });
            return; // Exit if ZONE_TAG is not set
        }

        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];

        // Queries for client IP, user agent, and Bot Ja4
        const queryClientIP = `
            query($zoneTag: String!, $formattedToday: String!) {
                viewer {
                    zones(filter: { zoneTag: $zoneTag }) {
                        firewallEventsAdaptiveGroups(
                            filter: { date: $formattedToday },
                            orderBy: [count_DESC],
                            limit: 5
                        ) {
                            count
                            dimensions {
                                clientIP
                            }
                        }
                    }
                }
            }`;

        const queryUserAgent = `
            query($zoneTag: String!, $formattedToday: String!) {
                viewer {
                    zones(filter: { zoneTag: $zoneTag }) {
                        firewallEventsAdaptiveGroups(
                            filter: { date: $formattedToday },
                            orderBy: [count_DESC],
                            limit: 5
                        ) {
                            count
                            dimensions {
                                userAgent
                            }
                        }
                    }
                }
            }`;

        const queryJa4 = `
            query($zoneTag: String!, $formattedToday: String!) {
                viewer {
                    zones(filter: { zoneTag: $zoneTag }) {
                        firewallEventsAdaptiveGroups(
                            filter: { date: $formattedToday },
                            orderBy: [count_DESC],
                            limit: 5
                        ) {
                            count
                            dimensions {
                                ja4
                            }
                        }
                    }
                }
            }`;

        const fetchQuery = async (payload) => {
            const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            // Log the response for debugging
            console.log("Fetched Data:", result);

            if (!result.data || result.errors) {
                console.error("GraphQL API error:", result.errors || "No data returned");
                throw new Error("Error fetching data from Cloudflare GraphQL API.");
            }

            return result.data;
        };

        try {
            // Fetch all
            const clientIPData = await fetchQuery({
                query: queryClientIP,
                variables: {
                    zoneTag: ZONE_TAG,
                    formattedToday: formattedToday,
                }
            });

            const userAgentData = await fetchQuery({
                query: queryUserAgent,
                variables: {
                    zoneTag: ZONE_TAG,
                    formattedToday: formattedToday,
                }
            });

            const wafja4Data = await fetchQuery({
                query: queryJa4,
                variables: {
                    zoneTag: ZONE_TAG,
                    formattedToday: formattedToday,
                }
            });


            const clientIPEvents = clientIPData.viewer.zones[0].firewallEventsAdaptiveGroups;
            const userAgentEvents = userAgentData.viewer.zones[0].firewallEventsAdaptiveGroups;
            const ja4Events = wafja4Data.viewer.zones[0].firewallEventsAdaptiveGroups;

            // Generate HTML content from JSON data
            const htmlContent = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Firewall Events</title>
				<style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .table-container {
            display: flex;
            gap: 20px; /* Space between tables */
        }
        table {
            border-collapse: collapse;
            width: 200px;
            background-color: #fdfdff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        th {
            background-color: #cce7ff;
            color: #333;
            padding: 10px;
        }
        td {
            background-color: #e8f0fe;
            color: #333;
            padding: 10px;
        }
        th, td {
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        tr:last-child td {
            border-bottom: none;
        }
        tr:hover td {
            background-color: #f0f8ff;
        }
    </style>
			</head>
			<body>
				<h1>Firewall Events</h1>
				<div class="table-container">
					<div class="table-wrapper">
						<h2>Top Client IP Requests</h2>
						<table>
							<thead>
								<tr>
									<th>Client IP</th>
									<th>Requests</th>
								</tr>
							</thead>
							<tbody>
								${clientIPEvents.map(event => `
									<tr>
										<td>${event.dimensions.clientIP}</td>
										<td>${event.count}</td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					</div>
					<div class="table-wrapper">
						<h2>Top User Agent Requests</h2>
						<table>
							<thead>
								<tr>
									<th>User Agent</th>
									<th>Requests</th>
								</tr>
							</thead>
							<tbody>
								${userAgentEvents.map(event => `
									<tr>
										<td>${event.dimensions.userAgent}</td>
										<td>${event.count}</td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					</div>
					<div class="table-wrapper">
						<h2>Top JA4s</h2>
						<table>
							<thead>
								<tr>
									<th>Description</th>
									<th>Count</th>
								</tr>
							</thead>
							<tbody>
								${ja4Events.map(event => `
									<tr>
										<td>${event.dimensions.ja4}</td>
										<td>${event.count}</td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					</div>
				</div>
			</body>
			</html>
			`;

            // Create and send the email
            const msg = createMimeMessage();
            msg.setSender({
                name: "Cloudflare Worker",
                addr: SENDER_EMAIL
            });
            msg.setRecipient(RECIPIENT_EMAIL);
            msg.setSubject("Firewall Events Report");
            msg.addMessage({
                contentType: 'text/html',
                data: htmlContent
            });

            const message = new EmailMessage(SENDER_EMAIL, RECIPIENT_EMAIL, msg.asRaw());

            try {
                await env.SEND_EMAIL.send(message);
                console.log("Email sent successfully!");
            } catch (e) {
                console.error(`Error sending email: ${e.message}`, {
                    status: 500
                });
            }
        } catch (error) {
            console.error("Error processing the scheduled event:", error);
        }
    }
};
