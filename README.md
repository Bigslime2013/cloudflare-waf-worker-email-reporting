- This worker allows you to send daily or weekly reports to your email (cron)
- it uses email worker, cron , email routing and Graphql api
- This is just a template, you can add any dimensions available in Graphql firewallEventsAdaptiveGroups based on customer requirement.



1. Configure email routing : https://developers.cloudflare.com/email-routing/
2. verify destination email : https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/




Query example:
```
query Viewer {
    viewer {
        budget
        zones(filter: { zoneTag: "b58cebb2af9371b20b" }, limit: 1) {
            zoneTag
            firewallEventsAdaptiveGroups(
                filter: { date: "2024-11-01" }
                orderBy: [count_DESC]
                limit: 5
            ) {
                count
                dimensions {
                    ja4
                }
            }
        }
    }
}
```
Available dimensions:
```
dimensions {
                    action
                    apiGatewayMatchedEndpoint
                    apiGatewayMatchedHost
                    botDetectionIds
                    botDetectionTags
                    botScore
                    botScoreSrcName
                    clientASNDescription
                    clientAsn
                    clientCountryName
                    clientIP
                    clientIPClass
                    clientRefererHost
                    clientRefererPath
                    clientRefererQuery
                    clientRefererScheme
                    clientRequestHTTPHost
                    clientRequestHTTPMethodName
                    clientRequestHTTPProtocol
                    clientRequestPath
                    clientRequestQuery
                    clientRequestScheme
                    contentScanHasFailed
                    contentScanNumMaliciousObj
                    contentScanNumObj
                    contentScanObjResults
                    contentScanObjSizes
                    contentScanObjTypes
                    date
                    datetime
                    datetimeFifteenMinutes
                    datetimeFiveMinutes
                    datetimeHour
                    datetimeMinute
                    description
                    edgeColoName
                    edgeResponseStatus
                    httpApplicationVersion
                    ja3Hash
                    ja4
                    kind
                    matchIndex
                    originResponseStatus
                    originatorRayName
                    rayName
                    ref
                    ruleId
                    rulesetId
                    sampleInterval
                    source
                    userAgent
                    wafAttackScore
                    wafAttackScoreClass
                    wafMlAttackScore
                    wafMlSqliAttackScore
                    wafMlXssAttackScore
                    wafRceAttackScore
                    wafSqliAttackScore
                    wafXssAttackScore
                    zoneVersion
                }

```
**Reference: **

https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
https://developers.cloudflare.com/analytics/graphql-api/
https://www.npmjs.com/package/mimetext
https://jldec.me/blog/routing-emails-through-a-cloudflare-worker
