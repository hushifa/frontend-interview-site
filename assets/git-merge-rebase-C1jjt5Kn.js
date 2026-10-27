var e={answerHtml:`<h2>先看提交图，而不是命令名称</h2>
<p>假设主分支和功能分支从 A 分开：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A---B       main
 \\
  C---D     feature
</code></pre></div>
<p><code>merge</code> 会把两条历史连接起来；<code>rebase</code> 会把功能分支上的改动重新应用到新的基点。最终文件可能一样，但提交图表达的开发过程不同，这会影响审查、排错和协作。</p>
<h2>merge 保留“分开开发再汇合”</h2>
<p>在 <code>main</code> 上执行 <code>git merge feature</code>，如果两边都产生了提交，通常会得到一个合并提交：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A---B-------M  main
 \\
  C---D---/
</code></pre></div>
<p>M 有两个父提交，历史仍然能看出 C、D 是独立分支完成的。这样的历史适合需要保留发布分支、多人协作轨迹或审计信息的项目。</p>
<p>如果目标分支只是功能分支之后没有新的提交，Git 可以 fast-forward，只把分支指针从 B 移到 D，不会额外产生 M。是否强制保留合并节点，应由团队规则决定。</p>
<h2>rebase 改变提交身份</h2>
<p>在 feature 上执行 <code>git rebase main</code>，Git 会把 C、D 的改动按顺序重新应用到 B 后面：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A---B---C&#x27;---D&#x27;  feature
    |
   main
</code></pre></div>
<p>C&#x27;、D&#x27; 通常是新的提交对象，因为父提交、时间或作者信息变化后哈希会改变。rebase 不是移动原来的提交，也不是把文件简单复制过去；它可能遇到冲突、空提交和已经存在的等价改动。</p>
<p>整理个人分支时可以用交互式 rebase 合并、改名和调整提交顺序，让审查者看到更清晰的逻辑。但一旦这些提交已经被别人拉取，就相当于要求协作者重新对齐历史。</p>
<h2>冲突处理时要验证每一层结果</h2>
<p>merge 通常在一次汇合时解决冲突；rebase 可能在重放多个提交的不同阶段多次冲突。解决冲突后，先检查文件是否表达了正确业务，再执行：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git add &lt;resolved-files&gt;
git rebase --continue
# 不想继续时：git rebase --abort
</code></pre></div>
<p><code>git rebase --skip</code> 会跳过当前提交，不是自动解决冲突。开始前先查看 <code>git status</code>，保存或处理未提交修改；中止操作只能撤销当前 rebase/merge 过程，不能替代备份。</p>
<p>冲突解决成功也不等于程序正确。至少要检查最终 diff、运行相关测试，并确认没有把对方新增的逻辑误删。提交图变得整齐，不能代替行为验证。</p>
<h2>共享分支为什么不能随意 rebase</h2>
<p>如果同事已经基于 D 开发，你把历史改成 D&#x27;，对方本地的 D 不会自动变成 D&#x27;。强制推送后，他们同步时可能出现重复提交、冲突或误覆盖。</p>
<p>个人尚未共享的分支可以按约定整理；公共分支、发布分支和别人正在依赖的分支通常应避免重写。确实需要更新远端时，<code>git push --force-with-lease</code> 会先检查远端是否仍是你预期的状态，比 <code>--force</code> 安全，但仍应提前沟通并准备恢复方案。</p>
<h2>用团队目标做选择</h2>
<p>选择 merge，如果需要保留真实汇合过程、分支已经共享、审计和回滚更看重原始关系。选择 rebase，如果是个人分支、希望在合并前整理提交、团队明确接受重写，并且能承担重新解决冲突的成本。</p>
<p>无论选哪一种，都要确认当前分支和基点，阅读最终差异，检查提交是否包含不该带入的文件，并在合并后验证构建和关键流程。Git 命令成功只说明历史操作完成，不说明冲突后的程序行为正确。</p>`};export{e as default};