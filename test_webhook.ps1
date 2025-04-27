$response = Invoke-RestMethod -Method Post -Uri "http://localhost:5678/webhook/calculate" `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"number": 5}'

Write-Output $response 