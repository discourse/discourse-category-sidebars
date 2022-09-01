import { getOwner } from "discourse-common/lib/get-owner";
import { ajax } from "discourse/lib/ajax";
import PostCooked from "discourse/widgets/post-cooked";
import { createWidget } from "discourse/widgets/widget";
import { h } from "virtual-dom";

function defaultSettings() {
  return {};
}

function parseSetups(raw) {
  const parsed = {};
  raw.split("|").forEach((setting) => {
    const [category, value] = setting.split(",").map((s) => s.trim());
    parsed[category] = parsed[category] || defaultSettings();
    parsed[category]["post"] = value;
  });
  return parsed;
}

function createSidebar(taxonomy) {
  const setup = setups[taxonomy];
  const post = [this.getPost(setup["post"])];

  document
    .querySelector("body")
    .classList.add("custom-sidebar", "sidebar-" + settings.sidebar_side);
  document
    .querySelector("#main-outlet > .regular")
    .classList.add("with-sidebar", settings.sidebar_side);

  return h(
    "div.category-sidebar-contents " + ".category-sidebar-" + taxonomy,
    post
  );
}

function createSidebarCategory(taxonomy) {
  const setup = setupByCategory[taxonomy];
  const post = [this.getPost(setup["post"])];

  document
    .querySelector("body")
    .classList.add("custom-sidebar", "sidebar-" + settings.sidebar_side);
  document
    .querySelector("#main-outlet > .regular")
    .classList.add("with-sidebar", settings.sidebar_side);

  return h(
    "div.category-sidebar-contents " + ".category-sidebar-" + taxonomy,
    post
  );
}

const postCache = {};
const setups = parseSetups(settings.setupDetails);
const setupByCategory = parseSetups(settings.setup_by_category_id);

createWidget("details-sidebar", {
  tagName: "div.sticky-sidebar",

  init() {
    let sidebarWrapper =
      document.getElementsByClassName("category-sidebar")[0] || 0;
    let headerHeight =
      document.getElementsByClassName("d-header-wrap")[0].offsetHeight || 0;
    let sidebarTop = headerHeight + 20 + "px";
    let sidebarMaxHeight = "calc(100vh - " + (headerHeight + 40) + "px)";
    if (sidebarWrapper) {
      sidebarWrapper.style.maxHeight = sidebarMaxHeight;
      sidebarWrapper.style.top = settings.stick_on_scroll ? sidebarTop : undefined;
      sidebarWrapper.style.position = settings.stick_on_scroll ? "sticky" : "";
    }
  },

  html() {
    const router = getOwner(this).lookup("router:main");
    const currentRouteParams = router.currentRoute.parent.params;
    const currentCategoryId = router.currentRoute?.parent?.attributes?.category_id || 0;
    const isDetailTopic = currentRouteParams.hasOwnProperty(
      "slug"
    );
    const idCurrentTopic = currentRouteParams.hasOwnProperty("id");

    console.log(router, 'router');
    console.log(setupByCategory, 'setupByCategory');

    // If currentTopic, add active class into li with contains in href the id of currentTopic
    if (idCurrentTopic) {
      window.addEventListener("load", function () {
        const currentSidebarItem = document.querySelector(
          "li a[href*='" + currentRouteParams.id + "']"
        );

        console.log(currentSidebarItem);

        if (currentSidebarItem) {
          currentSidebarItem.classList.add("active");
          if (currentSidebarItem.closest("details")) {
            currentSidebarItem.closest("details").setAttribute("open", "");
          }
        }
      });
    }

    if (setups["all"] && !isDetailTopic) {
      return createSidebar.call(this, "all");
    } else if (isDetailTopic) {
      const detailsSlug = currentRouteParams.slug

      // If set, show category sidebar
      if (detailsSlug && setups[detailsSlug]) {
        return createSidebar.call(this, detailsSlug);
      } else if (currentCategoryId && setupByCategory[currentCategoryId]) {
        return createSidebarCategory.call(this, currentCategoryId);
      }
    }

    // Remove classes if no sidebar returned
    document
      .querySelector("body")
      .classList.remove("custom-sidebar", "sidebar-" + settings.sidebar_side);
    document
      .querySelector("#main-outlet > .regular")
      .classList.remove("with-sidebar", settings.sidebar_side);
  },

  getPost(id) {
    if (!postCache[id]) {
      ajax(`/t/${id}.json`).then((response) => {
        postCache[id] = new PostCooked({
          cooked: response.post_stream.posts[0].cooked,
        });
        this.scheduleRerender();
      });
    }
    return postCache[id];
  },
});
