import app from "./server/core.js";
import "./server/api/routes.js";
import { PORT } from "./utils/env.js";

app.listen(PORT, () => {
	console.log("Server started on port " + PORT);
});
