var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>cherry-pick</code> 解决的是“只要某一个提交”的问题。比如主干上修了一个 bug，线上维护的发布分支也要这个修复，但不能把主干其他改动带过去。<code>git cherry-pick &lt;提交&gt;</code> 会算出这个提交相对它父提交改了什么，把这份改动应用到当前分支，生成一个新提交，新提交的哈希和原来的不一样。加上 <code>-x</code>，提交说明末尾会多一行 <code>(cherry picked from commit ...)</code>，以后能查到修复来自哪里。</p>
<p><code>bisect</code> 解决的是“哪个提交引入了问题”。你告诉它一个有问题的提交和一个正常的提交，它每次检出中间那个让你标记 good 或 bad，范围每次减半，大约 log2(N) 步就能找到第一个坏提交。</p>
<p>判断好坏能用命令完成时，用 <code>git bisect run &lt;命令&gt;</code> 让它自动跑。它看命令的退出码：0 是好，125 是跳过，1 到 127 之间的其他值是坏，128 及以上会中止整个 bisect。</p>
<p>结束后用 <code>git bisect reset</code> 回到原来的分支。</p>
</blockquote>
<h2>cherry-pick 怎样把修复移植到发布分支</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git switch release/1.2
git cherry-pick -x 71b8558
</code></pre></div>
<p>先切到发布分支，再把主干上的修复提交挑过来。遇到冲突时，解决完 <code>git add</code>，再 <code>git cherry-pick --continue</code>；不想要了就 <code>git cherry-pick --abort</code>。如果挑的是一个合并提交，要用 <code>-m &lt;父编号&gt;</code> 指定以哪个父提交为主线，不然 Git 不知道“改动”该相对哪一边算。</p>
<p>这样做以后，同一份修改在两个分支上各有一个提交。之后两个分支合并时，Git 通常能认出内容相同；可是如果其中一边又改了同一处，还是可能冲突。如果团队需要大量 cherry-pick，往往说明分支策略该调整了，参见<a href="/questions/git-merge-rebase/">《git merge 与 rebase 应该怎样选择？》</a>。</p>
<h2>bisect 怎样一步步找到坏提交</h2>
<p>手动二分的流程是这样的：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git bisect start HEAD v1.0   # 先坏后好
# Git 检出中间提交，测试后标记
git bisect good   # 或 git bisect bad
# 重复直到输出 &quot;&lt;哈希&gt; is the first bad commit&quot;
git bisect reset
</code></pre></div>
<p><code>git bisect start</code> 后面先写坏的、再写好的。为什么能这么快？因为每标记一次，可疑范围就减掉一半。比如两个版本之间有 1000 个提交，大约 10 步就能找到。</p>
<p>能用命令判断好坏时，就交给 <code>bisect run</code>：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git bisect start HEAD v1.0
git bisect run npm test
git bisect reset
</code></pre></div>
<p>这里有个容易出错的地方。如果测试命令在某些提交上根本跑不起来，比如依赖装不上，脚本应该返回 125，让 Git 跳过这个提交；不然它会被当成坏提交，结果就找错了。脚本因为被信号终止等原因返回 128 及以上时，Git 会报错停下，不会把当前提交标记为坏。</p>
<h2>常见追问</h2>
<p><strong>bisect 之前要注意什么？</strong></p>
<blockquote>
<p>工作区要干净。测试脚本最好放在仓库外面，或者放在不受历史版本影响的位置，不然检出旧提交时，脚本可能根本不存在。</p>
</blockquote>
<p><strong>问题时有时无怎么办？</strong></p>
<blockquote>
<p>二分要求每一步判断都准确。偶发问题要先找到稳定复现的办法，或者在脚本里多跑几次再给结论。</p>
</blockquote>
<p><strong>cherry-pick 和 rebase 有什么关系？</strong></p>
<blockquote>
<p>rebase 可以看成把一串提交依次 cherry-pick 到新的基点上。</p>
</blockquote>`};export{e as default};