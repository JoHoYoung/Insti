const test = () => {

    return new Promise((resolve, reject) =>{

        for(let i =0;i<4;i++)
        {
            resolve(i)
        }
    })
}

async function a(){
    let a = await test()
    console.log(a)
}
a()