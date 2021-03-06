import { sourceTransformer } from 'generate/lib/generator'

export const generateClientRoutes = sourceTransformer({
  filePath: '~/app/routes.ts',
  cfg: {},
  transformations: {
    Application(w, app, { src }) {
      src.require('AppRoute', '~/lib/archol/types', app)

      return w.statements([
        ['export const routes: AppRoute[] = ', w.map([app.routes])],
      ], false)
    },
    RouteCode(w, route) {
      return w.object({
        path: route.path,
        run: w.code(route.code)
      })
    },
    RouteRedirect(w, route, { src }) {
      src.require('appWindowPub', '~/rx/app/appwindow', route)
      return w.object({
        path: route.path,
        run: w.funcDecl([], '',
          [
            ['appWindowPub.goUrl(', route.redirect, ')']
          ], { async: true })
      })
    }
  }
})

