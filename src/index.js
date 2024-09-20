import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import { KJUR } from 'jsrsasign'
import axios from 'axios' // Import Axios at the top of the file
import { inNumberArray, isBetween, isRequiredAllOrNone, validateRequest } from './validations.js'

dotenv.config()
const app = express()
const port = process.env.PORT || 4000

app.use(express.json(), cors())
app.options('*', cors())

const propValidations = {
  role: inNumberArray([0, 1]),
  expirationSeconds: isBetween(1800, 172800)
}

const schemaValidations = [isRequiredAllOrNone(['meetingNumber', 'role'])]

const coerceRequestBody = (body) => ({
  ...body,
  ...['role', 'expirationSeconds'].reduce(
    (acc, cur) => ({ ...acc, [cur]: typeof body[cur] === 'string' ? parseInt(body[cur]) : body[cur] }),
    {}
  )
})

app.post('/', (req, res) => {
  try {
    const requestBody = coerceRequestBody(req.body)
    const validationErrors = validateRequest(requestBody, propValidations, schemaValidations)

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors })
    }

    const { meetingNumber, role, expirationSeconds } = requestBody
    const iat = Math.floor(Date.now() / 1000)
    const exp = expirationSeconds ? iat + expirationSeconds : iat + 60 * 60 * 2
    const oHeader = { alg: 'HS256', typ: 'JWT' }

    const oPayload = {
      appKey: 'IyVCvQWZTXGCbNuoIk1eaQ',
      sdkKey: 'M3OrocRsXDqsNbwISdJEMXDKPcE0834J',
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp
    }

    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, 'M3OrocRsXDqsNbwISdJEMXDKPcE0834J')
    return res.json({ signature: sdkJWT })
  } catch (err) {
    res.send({
      err: err
    })
  }
})

// appKey: 'IyVCvQWZTXGCbNuoIk1eaQ',
// sdkKey: 'M3OrocRsXDqsNbwISdJEMXDKPcE0834J',

app.post('/create-meeting', async (req, res) => {
  try {
    const { userId, topic, duration, password, agenda } = req.body

    // Replace with your actual Zoom API Key and Secret from the JWT app
    const apiKey = 'IyVCvQWZTXGCbNuoIk1eaQ'
    const apiSecret = 'M3OrocRsXDqsNbwISdJEMXDKPcE0834J'

    // Create a JWT token for Zoom REST API
    const token = jwt.sign(
      {
        iss: apiKey, // API Key
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // Token expires in 1 hour
      },
      apiSecret
    )

    console.log(token)

    // Create the meeting
    // const response = await axios.post(
    //   `https://api.zoom.us/v2/users/${userId}/meetings`,
    //   {
    //     topic: topic || 'New Zoom Meeting',
    //     type: 1, // Instant meeting
    //     start_time: new Date().toISOString(),
    //     duration: duration || 30,
    //     password: password || '123456',
    //     agenda: agenda || 'Default Agenda'
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // )

    // console.log(response.data)
    // res.status(200).json(response.data)
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.message)
    res.status(500).json({ message: 'Error creating meeting', error: error.message })
  }
})

app.listen(port, () => console.log(`Zoom Meeting SDK Auth Endpoint Sample Node.js, listening on port ${port}!`))
