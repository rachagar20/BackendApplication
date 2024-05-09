import {Router} from "express";
import { registerUser } from "../controllers/user_controller.js";

const router=Router();

//url is http://localhost:8080/api/v1/users/register
router.route    ("/register").post(registerUser);

export default router