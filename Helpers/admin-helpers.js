const db = require('../mongodb/connection');
const collection = require('../mongodb/collections');
const bcrypt = require('bcrypt');
const { log } = require('handlebars');



module.exports = {

    doSignup:(userData)=>{
            console.log(userData)
            return new Promise (async(resolve,reject)=>{
                if(userData.password){

                    userData.password = await bcrypt.hash(userData.password, 10);


                    let result=await db.get().collection(collection.ADMIN_COLLECTION).insertOne(userData);
                    
                    resolve(result.insertedId)
                }
                else{
                    console.error('Please Enter the Password')
                }

            })

    },

    doLogin:(adminData)=>{
        let loginstatus = { status: false ,name:null};

        if(adminData){
            
            return new Promise(async(resolve,reject)=>{
                if(adminData.password){
                    let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email});
                    if(admin){
                        bcrypt.compare(adminData.password,admin.password).then((status)=>{
                            if(status){
                                console.log('login  success ')
                                loginstatus.status=true
                                loginstatus.name=admin.name
                                resolve(loginstatus)
                            }else{
                                loginstatus.status=false
                                resolve(loginstatus)
                            }
                        })
                    }
                  

                }

            })

        }

    }





};