var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>git cherry-pick &lt;提交&gt;</code> 计算该提交相对父提交的修改，应用到当前分支并生成新提交。新提交的哈希与原提交不同。</li>
<li><code>-x</code> 会在提交说明末尾追加 <code>(cherry picked from commit ...)</code>，方便以后追溯修复来自哪里。</li>
<li><code>git bisect</code> 需要一个坏提交和一个好提交，每一步检出中间的提交让你标记 good 或 bad，大约 log2(N) 步就能找到第一个坏提交。</li>
<li><code>git bisect run &lt;命令&gt;</code> 用命令的退出码自动标记：0 为好，125 表示跳过，1 到 127 之间的其他值为坏，128 及以上会中止整个 bisect。结束后用 <code>git bisect reset</code> 回到原来的分支。</li>
</ul>
<h2>cherry-pick</h2>
<p>典型场景是主干已修复，线上维护的 <code>release</code> 分支也需要这个修复：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git switch release/1.2
git cherry-pick -x 71b8558
</code></pre></div>
<p>遇到冲突时，解决后 <code>git add</code> 再 <code>git cherry-pick --continue</code>，放弃则 <code>git cherry-pick --abort</code>。挑选合并提交需要 <code>-m &lt;父编号&gt;</code> 指定主线。</p>
<p>同一修改在两个分支各有一个提交，之后两分支合并时 Git 通常能识别内容相同，但如果其中一边又改了同一处，仍可能冲突。大量 cherry-pick 往往说明分支策略需要调整，参见<a href="/questions/git-merge-rebase/">《git merge 与 rebase 应该怎样选择？》</a>。</p>
<h2>bisect</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git bisect start HEAD v1.0   # 先坏后好
# Git 检出中间提交，测试后标记
git bisect good   # 或 git bisect bad
# 重复直到输出 &quot;&lt;哈希&gt; is the first bad commit&quot;
git bisect reset
</code></pre></div>
<p>能用命令判断好坏时交给 <code>bisect run</code>：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git bisect start HEAD v1.0
git bisect run npm test
git bisect reset
</code></pre></div>
<p>测试命令本身在某些提交上无法运行（例如依赖装不上）时，脚本应返回 125，让 Git 跳过这个提交，而不是误判为坏。脚本因被信号终止等原因返回 128 及以上的值时，Git 会报错并停止 bisect，不会把当前提交标记为坏。</p>
<h2>常见追问</h2>
<ul>
<li>bisect 前要注意什么？工作区要干净，测试脚本最好放在仓库外或不受历史版本影响的位置，否则检出旧提交时脚本可能不存在。</li>
<li>问题时有时无怎么办？二分依赖每一步判断准确，偶发问题要先找到稳定复现方式，或在脚本中多次运行再给出结论。</li>
<li>cherry-pick 和 rebase 有什么关系？rebase 可以看成把一串提交依次 cherry-pick 到新的基点上。</li>
</ul>`};export{e as default};