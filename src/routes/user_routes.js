import {Router} from "express";
import { registerUser,loginUser,logOutUser,refreshAccessToken} from "../controllers/user_controller.js";
import {upload} from "../middlewares/multer.js"
import { verifyJwtToken } from "../middlewares/auth_middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJwtToken,logOutUser)
router.route("/refresh-token").post(refreshAccessToken);
export default router