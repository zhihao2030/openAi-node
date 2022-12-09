import Koa from 'koa'
import { ChatGPTAPI } from 'chatgpt'
import Router from 'koa-router' // 引入koa-router

const router = new Router({ prefix: "/openAi" });

const app = new Koa(); // 创建koa应用

let currentChat = {}
const session = (ctx) =>{
    const session = ctx.query.session
    if (!session) {
        ctx.body = {
            flag: 0,
            msg: '未传入session'
        }
    } else {
        process.env.session = session
        ctx.body = {
            flag: 1,
            msg: '设置session成功'
        }
    }
}

const chat =async (ctx,next) =>{
    const msg = ctx.query.msg
    if (!process.env.session) {
        ctx.body = {
            flag: 0,
            msg: '未配置session'
        }
    }else if (!msg) {
        ctx.body = {
            flag: 0,
            msg: '未传入msg'
        }
    } else {
        try {
            currentChat.user = msg
            const api = new ChatGPTAPI({
                sessionToken: process.env.session
            })
            // ensure the API is properly authenticated
            await api.ensureAuth()

            // send a message and wait for the response
            const response = await api.sendMessage(
                msg
            )
            currentChat.openAi = response
            currentChat.status = true
           
            ctx.body = {
                flag: 1,
                data: {
                    currentChat: response,
                
                }
            }
            currentChat = {}
        } catch(e) {
            let auth = true
            if (JSON.stringify(e).includes('Unauthorized')) {
                auth = false
            }
            ctx.body = {
                flag: 0,
                msg: 'session错误，认证失败',
            }
        }
    }
}
router.get("/session", session); //登录接口

router.get("/chat", chat);  //注册接口

// 调用router.routes()来组装匹配好的路由，返回一个合并好的中间件
// 调用router.allowedMethods()获得一个中间件，当发送了不符合的请求时，会返回 `405 Method Not Allowed` 或 `501 Not Implemented`
app.use(router.routes()); //拆分路由要用的  下面有提到
app.use(router.allowedMethods({
    // throw: true, // 抛出错误，代替设置响应头状态
    // notImplemented: () => '不支持当前请求所需要的功能',
    // methodNotAllowed: () => '不支持的请求方式'
}));  //拆分路由要用的  下面有提到

// 启动服务监听本地3000端口
app.listen(8000, () => {
    console.log('应用已经启动，http://localhost:80');
})
