import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
	async scheduled(event,env) {
  
	  console.log(JSON.stringify(env))
	  const API_TOKEN = env.API_TOKEN;
	  const ZONE_TAG = env.ZONE_TAG;
	  const SENDER_EMAIL = "admin@zxc.co.in"; // Replace with your sender email
	  const RECIPIENT_EMAIL = "ajays@cloudflare.com"; // Replace with your recipient email
  
	  console.log("ZONE_TAG:", ZONE_TAG);
  
	  if (!ZONE_TAG) {
		console.log("Error: ZONE_TAG is not set", { status: 400 });
	  }
  
	  const endTime = new Date().toISOString();
	  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
	  const query = `
		query($zoneTag: String!, $datetimeGeq: String!, $datetimeLeq: String!) {
		  viewer {
			zones(filter: { zoneTag: $zoneTag }) {
			  firewallEventsAdaptive(
				filter: {
				  datetime_geq: $datetimeGeq,
				  datetime_leq: $datetimeLeq
				},
				limit: 10,
				orderBy: [datetime_DESC]
			  ) {
				action
				clientAsn
				clientCountryName
				clientIP
				clientRequestPath
				clientRequestQuery
				datetime
				source
				userAgent
			  }
			}
		  }
		}
	  `;
  
	  const payload = {
		query,
		variables: {
		  zoneTag: ZONE_TAG,
		  datetimeGeq: startTime,
		  datetimeLeq: endTime
		}
	  };
  
	  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
		method: 'POST',
		headers: {
		  'Authorization': `Bearer ${API_TOKEN}`,
		  'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	  });
  
	  if (!response.ok) {
		const errorText = await response.text();
		console.log(`Error fetching data: ${errorText}`, { status: response.status });
	  }
  
	  const data = await response.json();
	  console.log("GraphQL Response:", data);
  
	  // Check for GraphQL errors
	  if (data.errors) {
		console.log(`GraphQL errors: ${JSON.stringify(data.errors)}`, { status: 400 });
	  }
  
	  // Ensure viewer and zones are defined
	  if (!data.data || !data.data.viewer || !data.data.viewer.zones || data.data.viewer.zones.length === 0) {
		console.log("No data found for the specified ZONE_TAG", { status: 404 });
	  }
  
	  const events = data.data.viewer.zones[0].firewallEventsAdaptive;
  
	  // Generate HTML content from JSON data
	  const htmlContent = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>Firewall Events</title>
		  <style>
			body { font-family: Arial, sans-serif; margin: 20px; }
			table { width: 100%; border-collapse: collapse; }
			th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
			th { background-color: #f2f2f2; }
		  </style>
		</head>
		<body>
		  <h1>Firewall Events</h1>
		  <table>
			<thead>
			  <tr>
				<th>Action</th>
				<th>Client ASN</th>
				<th>Country</th>
				<th>Client IP</th>
				<th>Request Path</th>
				<th>Request Query</th>
				<th>Date/Time</th>
				<th>Source</th>
				<th>User Agent</th>
			  </tr>
			</thead>
			<tbody>
			  ${events.map(event => `
				<tr>
				  <td>${event.action}</td>
				  <td>${event.clientAsn}</td>
				  <td>${event.clientCountryName}</td>
				  <td>${event.clientIP}</td>
				  <td>${event.clientRequestPath}</td>
				  <td>${event.clientRequestQuery}</td>
				  <td>${new Date(event.datetime).toLocaleString()}</td>
				  <td>${event.source}</td>
				  <td>${event.userAgent}</td>
				</tr>
			  `).join('')}
			</tbody>
		  </table>
		</body>
		</html>
	  `;
  
	  // Create and send the email
	  const msg = createMimeMessage();
	  msg.setSender({ name: "Cloudflare Worker", addr: SENDER_EMAIL });
	  msg.setRecipient(RECIPIENT_EMAIL);
	  msg.setSubject("Firewall Events Report");
	  msg.addMessage({
		contentType: 'text/html',
		data: htmlContent // Use HTML content
	  });
	  //console.log("msg   " +  JSON.stringify(msg))
  
	  const message = new EmailMessage(SENDER_EMAIL, RECIPIENT_EMAIL, msg.asRaw());
	  //console.log("message    " +  JSON.stringify(message))
	  try {
		await env.SEND_EMAIL.send(message);
	  } catch (e) {
		console.log(`Error sending email: ${e.message}`, { status: 500 });
	  }
  
	   console.log("Email sent successfully!");
	}
  };



