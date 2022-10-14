require("dotenv").config();
const NodeCache = require("node-cache");
const axios = require("axios");
const qs = require("qs");
const utf8 = require("utf8");
const base64 = require("base-64");

const myCache = new NodeCache({ stdTTL: 86400 });

async function getAccessToken(clientId, clientSecret) {
  const accessToken = myCache.get("accessToken");

  const encoded = base64.encode(utf8.encode(`${clientId}:${clientSecret}`));
  const data = qs.stringify({
    grant_type: "client_credentials",
    ignoreCache: "true",
    return_authn_schemes: "true",
    return_client_metadata: "true",
    return_unconsented_scopes: "true",
  });

  const config = {
    method: "post",
    url: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };

  if (!accessToken) {
    try {
      const res = await axios(config);
      myCache.set("accessToken", res.data.access_token);
      return res.data.access_token;
    } catch (error) {
      console.log("something fishy", error);
      throw error;
    }
  } else {
    return accessToken;
  }
}

async function generateVaultToken(accessToken) {
  const clientToken = myCache.get("clientToken");

  if (!clientToken) {
    try {
      const config = {
        method: "post",
        url: "https://api-m.sandbox.paypal.com/v1/identity/generate-token",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: {
          customer_id: "customer_11",
        },
      };

      const res = await axios(config);

      myCache.set("clientToken", res.data.client_token);

      return res.data.client_token;
    } catch (error) {
      console.log(`generateVaultToken ${error}`);
      throw error;
    }
  } else {
    return clientToken;
  }
}

function getPayload(PORT) {
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "100.00",
        },
      },
    ],
    application_context: {
      return_url: `http://localhost:${PORT}/success`,
      cancel_url: `http://localhost:${PORT}/cancel`,
      brand_name: "CODEXY INC",
      user_action: "CONTINUE",
    },
    stored_credential: {
      payment_initiator: "MERCHANT",
      payment_type: "RECURRING",
      usage: "SUBSEQUENT",
      previous_network_transaction_reference: {
        id: "156GHJ654SFH543",
        network: "VISA",
      },
    },
  };
}

module.exports = {
  getAccessToken,
  generateVaultToken,
  getPayload,
};
