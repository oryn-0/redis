import express from "express";
import Redis from "ioredis";
import mongoose, { Query } from "mongoose";

const app = express();

// app.get("/redis", async (req, res) => {
//     const reply = await redis.ping();
//     res.json({ redis: reply });
// });

// app.get("/mongo", async (req, res) => {
//     const uri =
//         process.env.MONGO_DB_URL || "mongodb://localhost:27017/redis_practice";
//     await mongoose.connect(uri);
//     req.json({ mongo: "connected", database: mongoose.connection.name });
// });

app.use(express.json());

const redis = new Redis(process.env.REDIS_URI || "redis://localhost:6379");

const BANNER_KEY = "app:banner";

// app.post("/banner", async (req, res) => {
//     await redis.set(BANNER_KEY, req?.body?.message || "Welcome from Redis");
//     res.json({ success: true });
// });

// app.get("/banner", async (req, res) => {
//     const message = await redis.get(BANNER_KEY);
//     if (message) {
//         res.json({ message: message });
//     } else {
//         res.json({ message: "Not found" });
//     }
// });
// app.delete("/banner", async (req, res) => {
//     await redis.del(BANNER_KEY);
//     res.json({ success: true });
// });

// app.get("/banner/exists", async (req, res) => {
// 	const exist = await redis.exists(BANNER_KEY);
// 	console.log(exist);
//     res.json({ success: exist });
//     //res.json({success:!!exists}); it will set success as true or false means in boolean other wise in exist there will be 0 or 1
// });

app.post("/user/:id/json", async (req, res) => {
    await redis.set(`user:${req.params.id}:json`, JSON.stringify(req.body));
    res.json({ savedAs: "json" });
});

app.get("/user/:id/json", async (req, res) => {
    const getData = await redis.get(`user:${req.params.id}:json`);
    res.json({ data: getData ? JSON.parse(getData) : null });
});

app.post("/user/:id/hash", async (req, res) => {
    await redis.hset(`user:${req.params.id}:hash`, req.body);
    res.json({ savedAs: "Hash" });
});

app.get("/user/:id/hash", async (req, res) => {
    const hashData = await redis.hgetall(`user:${req.params.id}:hash`);
    return res.json({
        data: Object.keys(hashData).length > 0 ? hashData : null,
    });
});

function otpKey(mobileNo) {
    return `otp:${mobileNo}`;
}

app.post("/send-otp", async (req, res) => {
    const { mobileNo } = req.body;
    const otp = Math.floor(10000 + Math.random() * 900000).toString();
    await redis.set(otpKey(mobileNo), otp, "EX", 30); //setting expiry of 30s or ttl (time to live) after this time it will be removed from cache

    res.json({ success: true, message: "Otp Send successfully ", otp: otp });
});

app.post("/verify-otp", async (req, res) => {
    const { mobileNo, otp } = req.body;
    const savedOtp = await redis.get(otpKey(mobileNo));
    if (!savedOtp) {
        return res.json({ mesasge: "Otp expired " });
    }
    if (savedOtp !== otp) {
        return res.json({ message: "Otp invalid" });
    }
    await redis.del(otpKey(mobileNo));
    res.json({ mesasge: "Otp verified" });
});

app.get("/otp/:phone/ttl", async (req, res) => {
    const ttl = await redis.ttl(otpKey(req.params.phone));
    res.json({ ttl });
});

const QUEUE_KEY = "queue:emails";
app.post("/email", async (req, res) => {
    const job = {
        to: req.body.email,
        subject: req.body.subject || "No subject",
        body: req.body.body || "No body",
        createdAt: new Date().toISOString(),
    };
    await redis.lpush(QUEUE_KEY, JSON.stringify(job));
    res.json({ message: "Data added to queue", job });
});

app.get("/emails/process-one", async (req, res) => {
    const rawJson = await redis.rpop(QUEUE_KEY);
    if (!rawJson) {
        return res.json({
            success: false,
            message: "data not found",
        });
    }
    return res.json({
        success: true,
        message: "message sent",
        data: JSON.parse(rawJson),
    });
});

app.listen(3000, () => {
    console.log("Server is running on 3000");
});
