const mongoose = require("mongoose");

const fitnessVideoSchema = new mongoose.Schema(
{
    title:{
        type:String,
        required:true,
        trim:true
    },

    description:{
        type:String,
        required:true
    },

    category:{
        type:String,
        enum:[
            "stretching",
            "muscle"
        ],
        required:true
    },

    muscleGroup:{
        type:String,
        enum:[
            "abs",
            "back",
            "biceps",
            "chest",
            "forearm",
            "leg",
            "shoulder",
            "traps",
            "triceps"
        ],
        default:null
    },

    youtubeUrl:{
        type:String,
        required:true
    },

    youtubeVideoId:{
        type:String,
        required:true
    },

    thumbnailUrl:{
        type:String
    },

    views:{
        type:Number,
        default:0
    },

    isActive:{
        type:Boolean,
        default:true
    }

},
{
 timestamps:true
}
);

module.exports = mongoose.model("FitnessVideo", fitnessVideoSchema);
