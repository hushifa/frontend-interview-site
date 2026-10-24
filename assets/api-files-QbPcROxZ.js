var e={answerHtml:`<p>Blob 表示不可变的原始数据，File 在其基础上提供文件名等信息。页面通常通过用户选择或拖放获得文件，再用 FileReader、流或 object URL 等方式处理，不能任意读取用户磁盘上的所有文件。</p>
<p>URL.createObjectURL 为 Blob 创建可引用地址，适合图片或下载预览；不再使用时应 revokeObjectURL 释放相关资源。但不能在资源还需被用户操作时过早撤销，否则可能破坏预览或保存行为。</p>
<p>文件扩展名和 MIME 类型都不能单独证明内容可信。上传前可以做大小和格式提示，服务端仍应校验真实内容。大型文件处理还需考虑主线程成本、取消以及内存占用。</p>`};export{e as default};