var e={answerHtml:`<h2>简答</h2>
<ul>
<li>workflow 定义触发事件和任务，job 是可独立调度的任务，step 是任务内的步骤，runner 是执行环境。</li>
<li>同一 job 的步骤顺序执行，共享工作目录。</li>
<li>每个 run 步骤是独立的 shell，局部变量不会传到下一步。</li>
<li>只做检查的 workflow 应把权限限制为 contents: read。</li>
</ul>
<p>可以把 workflow 看成一份自动化流程说明，job 是其中可独立调度的任务，step 是任务内部的执行步骤，runner 则是实际运行这些步骤的机器或执行环境。</p>
<p>例如一次推送触发“检查前端” workflow，它安排一个检查 job，在 Linux runner 上依次检出代码、准备 Node、安装依赖、测试和构建。</p>
<h2>四层对象各负责什么</h2>
<table><thead><tr><th>对象</th><th>作用</th></tr></thead><tbody><tr><td>workflow</td><td>定义触发事件、任务及整体配置，通常位于 .github/workflows</td></tr><tr><td>job</td><td>组织一组步骤，并决定执行环境与任务依赖</td></tr><tr><td>step</td><td>运行 shell 命令，或通过 uses 调用可复用 action</td></tr><tr><td>runner</td><td>执行任务，提供操作系统、工具、文件系统和计算资源</td></tr></tbody></table>
<p>同一个 job 中的步骤通常顺序执行并共享相应工作目录，但每个 run 步骤是独立的 shell 过程。上一步创建的文件可以继续使用，普通 shell 局部变量却不会自动变成下一步的环境变量。</p>
<h2>一个只检查、不发布的例子</h2>
<p>下面假设项目已经定义 format:check、check 和 build 脚本，并提交了 npm 锁文件：</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">name: 前端检查

on: [push, pull_request, workflow_dispatch]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v7
      - name: 准备 Node
        uses: actions/setup-node@v7
        with:
          node-version: &#x27;24&#x27;
          cache: npm
      - name: 安装与检查
        run: |
          npm ci
          npm run format:check
          npm run check
          npm run build
</code></pre></div>
<p>workflow_dispatch 允许手动触发；push 和 pull_request 对应仓库事件。uses 复用 action，run 执行命令，二者不是不同类型的 runner。</p>
<p>例子固定了 Node 主版本，不等于固定精确补丁版本；ubuntu-latest 镜像也会更新。要求更强复现时，还应按项目需要明确版本文件、工具和环境。action 的主版本标签同样可能更新，要求固定具体实现时可以使用审核过的提交 SHA。</p>
<h2>Job 之间怎样决定先后</h2>
<p>没有声明依赖的 job 可以并行调度，是否立即执行还受可用 runner 和并发限制影响。需要先检查后部署时，应通过 needs 等机制表达关系，而不是依赖它们在 YAML 中的排列顺序。</p>
<p>GitHub 托管 runner 通常为 job 提供新的环境；自托管 runner 的持久状态与清理策略又由维护者负责。无论哪种，都不要假设另一个 job 的本地目录一定还能直接访问。</p>
<p>跨 job 传文件通常使用 artifact，传少量值可以使用相应输出机制。配置 needs 只建立执行依赖，不会顺便把前一个 job 的文件复制过来。</p>
<h2>缓存与构建产物不能混用</h2>
<p>缓存主要用于加速，例如复用包管理器的下载缓存。setup-node 的 npm 缓存不等于把一份永远正确的 node_modules 带到所有任务中，依赖安装仍需要执行并检查锁文件。</p>
<p>artifact 则用于保存和传递这次任务产生的文件，例如 dist 或测试报告。部署若要使用已经验证的产物，应明确取得同一次构建的 artifact，而不是在另一个步骤中悄悄用不同环境重新生成。</p>
<p>缓存命中也不等于构建正确，缓存键和失效条件不合理时反而可能保留旧结果。</p>
<h2>绿色检查不代表网站已经上线</h2>
<p>上面的流程只证明相应命令成功，没有配置部署任务，所以不会自动发布网站。真正发布还需要明确目标环境、所需权限、产物来源和发布后的验证。</p>
<p>PR 检查与正式发布可以具有不同权限。来自外部分支的代码、秘密变量和可写令牌，应按平台事件与权限模型分别设计，不能把一个部署配置无条件用于所有来源的检查。</p>
<p>不要为了让外部 PR 读取 secrets，改用 pull_request_target 后再检出并运行该 PR 的不可信代码；这个事件的信任上下文不同，安装脚本和测试代码也可能执行任意命令。构建检查通常只需要读取源码，发布权限应放在受保护的发布流程中。来自 PR 标题、分支名或其他外部字段的文本，也不能直接插入 shell 命令。</p>
<h2>自动发布还需要处理新旧运行竞争</h2>
<p>同一分支先后提交 A、B，如果 A 构建慢，B 已上线后 A 才执行部署，就可能把旧版本重新覆盖回去。可以按目标环境设置 concurrency 分组，并在部署前核对当前要发布的提交与产物身份。concurrency 不是保证严格 FIFO 的发布队列，设计时要明确是否允许跳过中间版本。</p>
<p>cancel-in-progress 适合中止过期检查，但发布中途取消可能留下部分上传状态。生产部署应采用平台支持的完整版本切换或明确的失败恢复方案，而不是认为“旧运行取消了”就自动回滚了外部副作用。</p>
<p>secrets 也不应被打包进前端静态文件。GitHub 在日志中遮蔽某些值，不会净化 dist；构建时注入到客户端代码的环境变量仍可能被访问者读取。要分别审查 CI 的运行权限、构建输出内容和部署目标权限。</p>
<p>排查失败时沿着 workflow run、job、具体 step 和日志定位。先区分没有触发、等待 runner、环境准备失败、命令失败或部署失败，通常比把所有情况统称为“Actions 坏了”更容易解决。</p>`};export{e as default};