import { NormalContainer } from '~/components/layout/container/Normal'
import { PostsSortingFab } from '~/components/modules/post/fab/PostsSortingFab'
import { PostTagsFAB } from '~/components/modules/post/fab/PostTagsFAB'
import { PostItem } from '~/components/modules/post/PostItem'
import { PostPagination } from '~/components/modules/post/PostPagination'
import { NothingFound } from '~/components/modules/shared/NothingFound'
import { SearchFAB } from '~/components/modules/shared/SearchFAB'
import { BackToTopFAB } from '~/components/ui/fab'
import { BottomToUpTransitionView } from '~/components/ui/transition'
import { OnlyDesktop } from '~/components/ui/viewport'
import { apiClient } from '~/lib/request'
import { definePrerenderPage } from '~/lib/request.server'

interface Props {
  page?: string
  size?: string
  sortBy?: string
  orderBy?: string
}

export const metadata = {
  title: '文章列表',
}

export default definePrerenderPage<Props>()({
  fetcher: async (params) => {
    const { page, size, orderBy, sortBy } = params || {}
    const currentPage = page ? Number.parseInt(page) : 1
    const currentSize = size ? Number.parseInt(size) : 10

    const result = await apiClient.post.getList(currentPage, currentSize, {
      sortBy: sortBy as any,
      sortOrder: orderBy === 'desc' ? -1 : 1,
    })

    // The backend's custom sort does not prioritize pinned articles. Fetch
    // those using its default order and render them separately on page one.
    const featuredPosts = [] as typeof result.data
    if (sortBy && currentPage === 1) {
      let pinnedPage = 1
      while (true) {
        const pinnedResult = await apiClient.post.getList(pinnedPage, 50)
        featuredPosts.push(...pinnedResult.data.filter((post) => !!post.pin))
        if (
          !pinnedResult.pagination.hasNextPage ||
          pinnedResult.data.some((post) => !post.pin)
        ) {
          break
        }
        pinnedPage += 1
      }
    }

    return { ...result, featuredPosts, customSort: !!sortBy }
  },
  Component: async (props) => {
    const { params } = props
    const { data, pagination, featuredPosts, customSort } = props.data
    const { page } = params

    const currentPage = page ? Number.parseInt(page) : 1

    if (data.length === 0 && featuredPosts.length === 0) {
      return <NothingFound />
    }
    return (
      <NormalContainer>
        <ul>
          {[
            ...featuredPosts,
            ...data.filter((item) => !customSort || !item.pin),
          ]
            .sort((a, b) => Number(!!b.pin) - Number(!!a.pin))
            .map((item, index) => {
              return (
                <BottomToUpTransitionView
                  lcpOptimization
                  key={item.id}
                  as="li"
                  delay={index * 100}
                >
                  <PostItem data={item} />
                </BottomToUpTransitionView>
              )
            })}
        </ul>

        <PostPagination pagination={pagination} />

        <PostsSortingFab />
        <PostTagsFAB />
        <SearchFAB />
        <OnlyDesktop>
          <BackToTopFAB />
        </OnlyDesktop>
      </NormalContainer>
    )
  },
})
