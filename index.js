var jsonBody = require('body/json')

module.exports = function webhook (route, callback) {
  if (!route) throw new TypeError('webhook access route required')

  return function handler (req, res, next) {
    function makeError (message, statusCode) {
      var error = new Error(message)
      error.statusCode = statusCode || 500
      return error
    }

    function handleError (err) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.statusCode = err.statusCode
      res.end(err.stack || err.toString())
    }

    function handlePost (err, body) {
      callback(err, body)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.statusCode = err ? 500 : 200
      res.end(err ? err.stack || err.toString() : 'ok')
    }

    function processWebhook (name) {
      var accepted = [
        'checkin.created',
        'ticket.created',
        'ticket.completed',
        'ticket.updated',
        'ticket.unsnoozed',
        'ticket.voided',
        'registration.started',
        'registration.filling',
        'registration.updated',
        'registration.finished',
        'registration.completed'
      ];
      if (~accepted.indexOf(name)) jsonBody(req, res, handlePost)
      else handleError(makeError('Unknown webhook name: ' + name, 400))
    }

    if (req.url !== route) {
      next()
      return
    }

    if (req.method !== 'POST') {
      res.writeHead(req.method === 'OPTIONS' ? 200 : 405, {'Allow': 'OPTIONS, POST'})
      res.end()
      return
    }

    if (req.headers['x-webhook-name']) processWebhook(req.headers['x-webhook-name'])
    else handleError(makeError('Missing header', 400))
  }
}
