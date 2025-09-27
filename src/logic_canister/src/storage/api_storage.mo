import Map "mo:base/HashMap";
import Principal "mo:base/Principal";
import Types "../types/types";
import Buffer "mo:base/Buffer";
import Storage "storage_interface";

module {
  public type User = Types.User;
  public type History = Types.DetectionHistory;
  
  public class ApiHistoryStorage(
    apiHistoryStorage: [(Principal, [History])],
  ) : Storage.ApiHistoryInterface  { 
    // In-memory storage (HashMap for fast lookups)
    private var apiHistoryStore = Map.HashMap<Principal, Buffer.Buffer<History>>(0, Principal.equal, Principal.hash);


    // Initialize from stable storage
    do {
      if (apiHistoryStorage.size() > 0) {
        for ((key, value) in apiHistoryStorage.vals()) {
          apiHistoryStore.put(key, Buffer.fromArray<History>(value));
      };
      };
    };

    public func saveHistory(principal: Principal, history: History) : () {
      let existingBuffer = apiHistoryStore.get(principal);
      switch (existingBuffer) {
        case (?buffer) buffer.add(history);
        case null apiHistoryStore.put(principal, Buffer.fromArray([history]));
      };
    };

    public func getHistoryByPrincipal(principal: Principal) : ?[History] {
      switch (apiHistoryStore.get(principal)) {
        case (?buffer) return ?Buffer.toArray(buffer);
        case null return null;
      };
    };

    // Persistence functions - return data for stable storage
    public func getApiHistoryForStorage() : [(Principal, [History])] {
      let out = Buffer.Buffer<(Principal, [History])>(apiHistoryStore.size());
      for ((p, buf) in apiHistoryStore.entries()) {
        out.add((p, Buffer.toArray(buf)));
      };
      return Buffer.toArray(out);
    };
  };
}
