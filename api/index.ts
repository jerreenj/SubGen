import app from "../artifacts/api-server/src/app";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
};

export default app;
