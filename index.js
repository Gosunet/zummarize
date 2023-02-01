const functions = require('@google-cloud/functions-framework')

// Register an HTTP function with the Functions Framework
functions.http('zummarize-function', (req, res) => {
  // Your code here

  console.log(req.body)

  // Send an HTTP response
  res.send(req.body.challenge)
})
