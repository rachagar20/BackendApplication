import {Router} from "express";
import {registerUser,
        loginUser,
        logOutUser,
        refreshAccessToken,
        changeCurrentPassword, 
        getCurrentUser, 
        updateAccountDetails, 
        updateUserAvatar, 
        getUserChannelProfile, 
        getWatchHistory} from "../controllers/user_controller.js";
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
router.route("/change-password").post(verifyJwtToken,changeCurrentPassword);
router.route("/current-user").post(verifyJwtToken,getCurrentUser)
router.route("/update-account").patch(verifyJwtToken,updateAccountDetails);
router.route("/update-avatar").patch(verifyJwtToken,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJwtToken,upload.single("coverImage"),updateUserAvatar)

router.route("/c/:username").get(verifyJwtToken,getUserChannelProfile);
router.route("/history").get(verifyJwtToken,getWatchHistory);
export default router