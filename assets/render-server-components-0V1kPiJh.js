var e={answerHtml:`<p>两者不是同一概念。SSR 关注生成初始 HTML；Server Components 关注一类组件在与客户端应用分离的环境中提前执行，使其组件代码不必全部进入客户端包。它们可以协作，也可在构建时使用。</p>
<p>需要浏览器交互和客户端状态的部分仍要由 Client Components 承担。跨边界传递的数据必须符合框架支持的序列化约束，服务端能力也不能因为组件结构变化就暴露给浏览器。</p>
<p>实际项目通常通过支持 RSC 的框架使用该能力。底层打包器与框架集成 API 的稳定性要求不同于普通组件 API，选型与升级应阅读当前版本文档，不能把 Server Component 简化为“带 async 的任意组件”。</p>`};export{e as default};