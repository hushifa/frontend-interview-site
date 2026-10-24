var e={answerHtml:`<p>workflow 定义自动化流程，通过 push、pull_request、手动触发等事件启动。一个流程包含多个 job，每个 job 在 runner 上执行一组 step；step 可以运行命令或复用 action。</p>
<p>job 之间默认具有独立执行环境，依赖顺序通过 needs 等机制声明。需要跨 job 传递文件时使用产物等机制，不能假设上一个 runner 的本地目录仍然存在。</p>
<p>前端常见流程包括锁定依赖安装、格式检查、类型检查、测试和构建。发布应使用所需的最小权限，并区分检查和真正部署。缓存用于加速，构建产物用于交付，二者目的不同。</p>`};export{e as default};