import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user_model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

//Register a New User
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);
    console.log(fullName, email, username, password);
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

//Generate Refresh and Access Token for a user
const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const userInDB=await User.findById(userId);
        const accessToken=userInDB.generateAccessToken();
        const refreshToken=userInDB.generateRefreshToken();
        
        userInDB.refreshToken=refreshToken;
        //if validate is set true then save operation would require
        //all the required field in the user model.Thus it would require
        //password to be saved.So set validate to False
        await userInDB.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    }catch(error){
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens");
    }
}

//Log In for a user
const loginUser=asyncHandler(async(req,res)=>{
    //take the data from the user
    const { username , password, email}=req.body;

    if(!email&&!username){
        throw new ApiError(400,"username or email is required");
    }
    console.log(username,email,password)
    const userInDB=await User.findOne({$or:[{email:email},{username:username}]});
    console.log(userInDB)
    if(!userInDB){
        throw new ApiError(404,"User doesnot exist");
    }

    const isPasswordValid=await userInDB.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"User Credentials do not match")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(userInDB._id);
    console.log(accessToken);
    console.log("-----------------------------------")
    console.log(refreshToken)
    const loggedInUser=await User.findById(userInDB._id).select("-password -refreshToken");
    //due to this cookies can only be modified/handled by the server side and not the client side
    const options={
        httpOnly:true, 
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser,
                refreshToken, 
                accessToken
            },
            "User is Logged In successfully"
        )
    )




})


const logOutUser=asyncHandler(async(req,res)=>{
    //need user information which i can get 
    const user=req.user;
    await User.findByIdAndUpdate(
        user._id,{
            $set:{
                refreshToken:undefined
            }
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,"","User Logged out Successfully")
    )
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   try {
     const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;
     if(!incomingRefreshToken){
         throw new ApiError(401,"Unauthorized Request");
     }
 
     const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
     const userInDB=await User.findById(decodedToken?._id);
 
     if(!userInDB){
         throw new ApiError(404,"The refresh token is invalid")
     }
     if(userInDB.refreshToken!==incomingRefreshToken){
         throw new ApiError(404,"The refresh token has expired");
     }
 
     const {accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshTokens(userInDB._id);
 
     const options={
        httpOnly:true,
        secure:true
     }
 
     return res.status(200).cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options).json(
         new ApiResponse(200,{
             refreshToken:newRefreshToken,
             accessToken
         },"New access token generated for the user")
     )
   } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token");
   }

})
export {registerUser,loginUser,logOutUser,refreshAccessToken}