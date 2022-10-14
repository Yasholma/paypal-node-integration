require("dotenv").config();
const paypal = require("paypal-rest-sdk");
const { getAccessToken, getPayload, generateVaultToken } = require("./util");
const axios = require("axios");

const app = require("express")();

const PORT = process.env.PORT || 2000;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;

paypal.configure({
  mode: process.env.MODE,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

app.post("/pay", async (req, res) => {
  const accessToken = await getAccessToken(clientId, clientSecret);

  try {
    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        ...getPayload(PORT),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(response.data);
    const payment = response.data;
    for (let i = 0; i < payment.links.length; i++) {
      if (payment.links[i].rel === "approve") {
        res.redirect(payment.links[i].href);
      }
    }
  } catch (error) {
    console.log("issue making request", error);
  }
});

app.get("/success", (req, res) => {
  console.log(req.query);
  // console.log(res.data);
  res.send("success").status(200);
});

app.post("/webhook", (req, res) => {
  // console.log(req.body);
  res.send(["accepted"]).status(200);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
