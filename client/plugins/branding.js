export default ({ $config }, inject) => {
  const branding = $config.branding || {}

  inject('branding', {
    name: branding.name || 'Toddio',
    shortName: branding.shortName || branding.name || 'Toddio',
    displayName: branding.displayName || branding.shortName || branding.name || 'Toddio',
    logo: branding.logo || `${$config.routerBasePath}/icon.png`,
    icon: branding.icon || `${$config.routerBasePath}/icon.png`,
    favicon: branding.favicon || `${$config.routerBasePath}/favicon.ico`,
    appleIcon: branding.appleIcon || `${$config.routerBasePath}/ios_icon.png`,
    themeColor: branding.themeColor || '#232323'
  })
}
