import { Component } from "@kithinji/orca";
import { apply$, style$ } from "@kithinji/arcane";
import { AppHeader } from "@/shared/component/header";
import { MainArea } from "./components/main";

@Component({
  inject: [AppHeader],
  route: "/?reload*",
})
export class AppPage {
  props!: {
    reload?: boolean;
  };

  build() {
    return (
      <div {...apply$(cls.container)}>
        <AppHeader reload={this.props.reload} />
        <div {...apply$(cls.content)}>
          <MainArea />
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    backgroundColor: "#161616",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    color: "#e8e8e8",
  },
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
});
