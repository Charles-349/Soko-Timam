import axios from "axios";
import dayjs from "dayjs";

export const getAccessToken = async () => {
  const { data } = await axios.get(
    `https://${process.env.MPESA_ENV === "sandbox" ? "sandbox" : "api"}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
    {
      auth: {
        username: process.env.MPESA_CONSUMER_KEY!,
        password: process.env.MPESA_CONSUMER_SECRET!,
      },
    }
  );
  return data.access_token;
};

export const generatePassword = () => {
  const timestamp = dayjs().format("YYYYMMDDHHmmss");
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  return { password, timestamp };
};