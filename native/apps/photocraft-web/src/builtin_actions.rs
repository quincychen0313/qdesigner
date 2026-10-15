//! Bundled actions are available even when browser storage cannot be opened or read.
//! Hydrate custom actions first, then append missing built-ins in memory without rewriting
//! the stored action file. Subsequent explicit edits use the normal preset persistence path.
use photocraft_engine::{Session, actions_cmds::ActionsFile};

fn install(session: &mut Session) -> Result<usize, String> {
    let builtins: ActionsFile = serde_json::from_str(include_str!("builtin-actions.json")).map_err(|e| e.to_string())?;
    if builtins.version != 1 {
        return Err("Unsupported bundled Actions version".into());
    }
    let before = session.actions.list.len();
    for action in builtins.actions {
        if !session.actions.list.iter().any(|existing| existing.name == action.name) {
            session.actions.list.push(action);
        }
    }
    Ok(session.actions.list.len() - before)
}

pub fn session(bridge: crate::preset_bridge::Bridge) -> (Session, Vec<String>) {
    let (mut session, mut warnings) = crate::preset_bridge::session(bridge);
    if let Err(error) = install(&mut session) {
        warnings.push(format!("Built-in Actions: {error}"));
    }
    (session, warnings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::preset_bridge::Bridge;
    use photocraft_engine::{actions_cmds::Action, preset_store::ACTIONS_FILE};
    use serde_json::json;

    #[test]
    fn unavailable_storage_still_has_all_actions_and_can_execute() {
        let bridge = Bridge::default();
        bridge.unavailable("NotFoundError: The object can not be found here.".into());
        let (mut session, warnings) = session(bridge.clone());
        assert!(warnings.is_empty());
        assert_eq!(session.actions.list.len(), 26);
        assert_eq!(install(&mut session).unwrap(), 0);
        assert!(bridge.begin().is_none());
        session.execute("file.new", json!({"width":30,"height":30})).unwrap();
        let index = session.actions.list.iter().position(|a| a.name == "Guides · Thirds").unwrap();
        session.execute("actions.play", json!({"action":index})).unwrap();
    }

    #[test]
    fn saved_custom_actions_and_edited_builtins_win_without_rewriting() {
        let bridge = Bridge::default();
        let custom = Action { name: "My action".into(), steps: vec![] };
        let edited = Action { name: "Creative Effects · Sharpen".into(), steps: vec![] };
        let saved = ActionsFile { version: 1, actions: vec![custom.clone(), edited.clone()] };
        bridge.load(ACTIONS_FILE, serde_json::to_vec(&saved).unwrap()).unwrap();
        let (mut session, warnings) = session(bridge.clone());
        assert!(warnings.is_empty());
        assert_eq!(session.actions.list.len(), 27);
        assert_eq!(session.actions.list[0], custom);
        assert_eq!(session.actions.list[1], edited);
        session.sync_preset_store();
        if let Some(batch) = bridge.begin() {
            assert!(!batch.contains_key(ACTIONS_FILE));
        }
    }

    #[test]
    fn unreadable_action_record_is_preserved_and_builtins_remain_available() {
        let bridge = Bridge::default();
        bridge.load(ACTIONS_FILE, b"invalid original data".to_vec()).unwrap();
        let (mut session, warnings) = session(bridge.clone());
        assert!(!warnings.is_empty());
        assert_eq!(session.actions.list.len(), 26);
        session.sync_preset_store();
        if let Some(batch) = bridge.begin() {
            assert!(!batch.contains_key(ACTIONS_FILE));
        }
    }
}
