import { Request, Response } from 'express'

export function zummarizefunction(req: Request, res: Response) {
    console.log(req.body)

    // Send an HTTP response
    res.send(req.body.challenge)
}