tmpl = (tpl, data) ->
  re = /<%=([^%>]+)?%>/
  while match = re.exec(tpl)
    tpl = tpl.replace(match[0], data[match[1].trim()] || '')
  return tpl

class Pagination

  options: {
    n: 50,
    maxPages: 5,
    sep: '',
    type: '',
    tmpl: '<a href="<%= link %>"><span><%= title %></span></a>',
    tmplSelected: '<b><span><%= title %></span></b>',
    basePath: ''
  }

  constructor: (options) ->
    @options = Object.assign(@options, options)

  data: (req, totalCount) ->
    page = req.params.pg || 1
    if (page <= 0)
      page = 1 # Если №страницы меньше или равен 0, считаем, что это первая страница
    if @options.n == 0
      pagesN = 0
    else
      if (totalCount)
        pagesN = Math.ceil(totalCount / @options.n)
      else
        pagesN = 1
    if page > pagesN
      page = pagesN # Если №страницы больше возможного кол-ва страниц
    if @options.desc
      page = pagesN - page + 1
    html = ''

    links = pNext = pPrev = []
    if pagesN != 0 && pagesN != 1
      links = []
      descN = 0
      for i in [0..pagesN]
        pageNumber = i + 1
        descN--
        if i <= page - Math.round(@options.maxPages / 2) - 1 || i >= page + Math.round(@options.maxPages / 2) - 1
          continue
        if @options.basePath == '/'
          qstr2 = @options.basePath + 'pg'
        else
          qstr2 = @options.basePath + '/pg'
        qstr2 += @options.type + pageNumber

        @options.type + pageNumber
        d = {
          title: pageNumber,
          link: qstr2
        }
        if ((i + 1) == page)
          links.push(tmpl(@options.tmplSelected, d))
        else
          links.push(tmpl(@options.tmpl, d))
        if (page != pagesN)
          pNext = @options.basePath + '/pg' + @options.type + (page + 1)
        if (page - 1 != 0)
          pPrev = @options.basePath + '/pg' + @options.type + (page - 1)
    if links.length > 0
      html = links.join(@options.sep)
    if (@options['n'] == 0)
      limit = ''
    else
      offset = (page - 1) * @options.n
      limit = @options.n
    return {
      pNums: html,
      offset: offset,
      limit: limit,
      page: page,
      totalItems: totalCount,
      totalPages: links.length,
      pNext: pNext,
      pPrev: pPrev
    }

module.exports = Pagination
