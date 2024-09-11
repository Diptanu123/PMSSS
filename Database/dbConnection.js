import mongoose from "mongoose";

export const dbConnection=()=>{
  mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Mongodb Connected");
  }).catch((err) => {
    console.log("error",err)
  });
}

const userSchema=mongoose.Schema({
    studentName:{
        type:String,
        require:true
    },
    instituteName:{
        type:String,
        require:true
    },
    studentId:{
        type:String,
        require:true
    },
    studentPassword:{
        type:String,
        require:true
    },
    phNumber:{
        type:String,
        require:true
    }

});

export const userData=mongoose.model("Student",userSchema);