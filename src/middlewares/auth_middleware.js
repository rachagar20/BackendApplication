import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user_model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwtToken=asyncHandler(async(req,res,next)=>{
    const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","");
    if(!token){
        throw new ApiError(401,"Unauthorized access");
    }

    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    
    if(!user){
        throw new ApiError(401,"Invalid access Token");
    }
    req.user=user;
    next();
})