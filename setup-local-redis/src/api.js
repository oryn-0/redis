import express from "express";
import { emailQueue } from "./queue.js";

const app = express();

app.use(express.json());

app.post("/welcome-email", async (req, res) => {
    try {
        const job = await emailQueue.add(
            "send-welcome-email",
            { to: req.body.to, name: req.body.name || " Learner " },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
            },
        );
        return res.json({
            message: "Send welcome email set to the queue",
            job: job
        });
    } catch (error) {
        return res.json(error.message);
    }
});

app.listen(3000, () => {
	console.log("Sever is listening on the port 3000");
})