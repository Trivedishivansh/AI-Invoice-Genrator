import mongoose from "mongoose";

export const connectDB = async ()=>{
  await mongoose.connect('mongodb+srv://shivanshpankaj1102_db_user:shivansh12345@cluster0.gttius5.mongodb.net/?appName=Invoice-Ai').then(()=>{console.log('DB connected')})
}