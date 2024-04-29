import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 50;
        },
        number
      >;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAirdropDistributionStatAirdropDistributionStat
  extends Schema.CollectionType {
  collectionName: 'airdrop_distribution_stats';
  info: {
    singularName: 'airdrop-distribution-stat';
    pluralName: 'airdrop-distribution-stats';
    displayName: 'Airdrop Distribution Stat';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    timestamp: Attribute.BigInteger;
    snapshot_id: Attribute.BigInteger;
    distributed_listing_point: Attribute.BigInteger;
    distributed_bidding_point: Attribute.BigInteger;
    distributed_sale_point: Attribute.BigInteger;
    distributed_extra_point: Attribute.BigInteger;
    user_multiplier_json: Attribute.JSON;
    is_user_multiplier_disabled: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::airdrop-distribution-stat.airdrop-distribution-stat',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::airdrop-distribution-stat.airdrop-distribution-stat',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAirdropHistoryLogAirdropHistoryLog
  extends Schema.CollectionType {
  collectionName: 'airdrop_history_logs';
  info: {
    singularName: 'airdrop-history-log';
    pluralName: 'airdrop-history-logs';
    displayName: 'Airdrop History Log';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    type: Attribute.String;
    timestamp: Attribute.BigInteger;
    nft_trade_log: Attribute.Relation<
      'api::airdrop-history-log.airdrop-history-log',
      'oneToOne',
      'api::nft-trade-log.nft-trade-log'
    >;
    pre_point: Attribute.Float & Attribute.DefaultTo<0>;
    airdrop_point: Attribute.Float & Attribute.DefaultTo<0>;
    exchange_user: Attribute.Relation<
      'api::airdrop-history-log.airdrop-history-log',
      'oneToOne',
      'api::exchange-user.exchange-user'
    >;
    listing_valid_timestamp: Attribute.BigInteger;
    floor_price_atm: Attribute.Float;
    token_id: Attribute.BigInteger;
    nft_address: Attribute.String;
    is_cancelled: Attribute.Boolean & Attribute.DefaultTo<false>;
    is_distributed: Attribute.Boolean & Attribute.DefaultTo<false>;
    snapshot_id: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::airdrop-history-log.airdrop-history-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::airdrop-history-log.airdrop-history-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAirdropStatLogAirdropStatLog extends Schema.CollectionType {
  collectionName: 'airdrop_stat_logs';
  info: {
    singularName: 'airdrop-stat-log';
    pluralName: 'airdrop-stat-logs';
    displayName: 'Airdrop Stat Log';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    exchange_user: Attribute.Relation<
      'api::airdrop-stat-log.airdrop-stat-log',
      'oneToOne',
      'api::exchange-user.exchange-user'
    >;
    sale_point_24h: Attribute.Float & Attribute.DefaultTo<0>;
    listing_point_24h: Attribute.Float & Attribute.DefaultTo<0>;
    bidding_point_24h: Attribute.Float & Attribute.DefaultTo<0>;
    timestamp: Attribute.BigInteger;
    extra_point_24h: Attribute.Float & Attribute.DefaultTo<0>;
    multiplier_detail: Attribute.JSON;
    total_trade_point: Attribute.Float;
    total_airdrop_point: Attribute.Float;
    snapshot_id: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::airdrop-stat-log.airdrop-stat-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::airdrop-stat-log.airdrop-stat-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBatchBuyOrderBatchBuyOrder extends Schema.CollectionType {
  collectionName: 'batch_buy_orders';
  info: {
    singularName: 'batch-buy-order';
    pluralName: 'batch-buy-orders';
    displayName: 'Batch Buy Order';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    buy_orders: Attribute.Relation<
      'api::batch-buy-order.batch-buy-order',
      'oneToMany',
      'api::buy-order.buy-order'
    >;
    is_cancelled: Attribute.Boolean & Attribute.DefaultTo<false>;
    is_all_sold: Attribute.Boolean & Attribute.DefaultTo<false>;
    is_expired: Attribute.Boolean & Attribute.DefaultTo<false>;
    listing_time: Attribute.BigInteger;
    expiration_time: Attribute.BigInteger;
    maker: Attribute.String;
    collection: Attribute.Relation<
      'api::batch-buy-order.batch-buy-order',
      'oneToOne',
      'api::collection.collection'
    >;
    total_quantity: Attribute.BigInteger;
    total_price: Attribute.BigInteger;
    total_price_in_eth: Attribute.Float;
    order_id: Attribute.Text;
    single_price: Attribute.BigInteger;
    single_price_in_eth: Attribute.Float;
    taker: Attribute.String;
    sale_kind: Attribute.Integer;
    hash_nonce: Attribute.BigInteger;
    nonce: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::batch-buy-order.batch-buy-order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::batch-buy-order.batch-buy-order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBuyOrderBuyOrder extends Schema.CollectionType {
  collectionName: 'buy_orders';
  info: {
    singularName: 'buy-order';
    pluralName: 'buy-orders';
    displayName: 'Buy Order';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    schema: Attribute.String;
    token_id: Attribute.BigInteger;
    quantity: Attribute.BigInteger;
    order_hash: Attribute.Text;
    collection: Attribute.Relation<
      'api::buy-order.buy-order',
      'oneToOne',
      'api::collection.collection'
    >;
    is_hidden: Attribute.Boolean & Attribute.DefaultTo<false>;
    is_sold: Attribute.Boolean & Attribute.DefaultTo<false>;
    sale_kind: Attribute.Integer;
    side: Attribute.Integer;
    maker: Attribute.String;
    taker: Attribute.String;
    expiration_time: Attribute.BigInteger;
    listing_time: Attribute.BigInteger;
    standard: Attribute.String;
    nft: Attribute.Relation<
      'api::buy-order.buy-order',
      'manyToOne',
      'api::nft.nft'
    >;
    nonce: Attribute.BigInteger;
    single_price_eth: Attribute.Float;
    exchange_data: Attribute.Text;
    token: Attribute.Relation<
      'api::buy-order.buy-order',
      'oneToOne',
      'api::token.token'
    >;
    contract_address: Attribute.String;
    batch_buy_order: Attribute.Relation<
      'api::buy-order.buy-order',
      'manyToOne',
      'api::batch-buy-order.batch-buy-order'
    >;
    total_price_in_eth: Attribute.Float;
    single_price: Attribute.String;
    total_price: Attribute.String;
    hash_nonce: Attribute.BigInteger;
    base_price: Attribute.BigInteger;
    order_id: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::buy-order.buy-order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::buy-order.buy-order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCoinPriceCoinPrice extends Schema.CollectionType {
  collectionName: 'coin_prices';
  info: {
    singularName: 'coin-price';
    pluralName: 'coin-prices';
    displayName: 'CoinPrice';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    price: Attribute.Decimal & Attribute.Required & Attribute.DefaultTo<0>;
    symbol: Attribute.Text & Attribute.Required & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::coin-price.coin-price',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::coin-price.coin-price',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCollectionCollection extends Schema.CollectionType {
  collectionName: 'collections';
  info: {
    singularName: 'collection';
    pluralName: 'collections';
    displayName: 'Collection';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    slug: Attribute.String & Attribute.Required & Attribute.Unique;
    contract_address: Attribute.String & Attribute.Required;
    token_uri: Attribute.String & Attribute.Unique;
    name: Attribute.String & Attribute.Required;
    description: Attribute.String;
    logo_url: Attribute.String;
    banner_url: Attribute.String;
    twitter: Attribute.String;
    discord: Attribute.String;
    website: Attribute.String;
    nfts: Attribute.Relation<
      'api::collection.collection',
      'oneToMany',
      'api::nft.nft'
    >;
    collection_stat_logs: Attribute.Relation<
      'api::collection.collection',
      'oneToMany',
      'api::collection-stat-log.collection-stat-log'
    >;
    total_supply: Attribute.Integer & Attribute.DefaultTo<0>;
    owner_count: Attribute.Integer & Attribute.DefaultTo<0>;
    listing_count: Attribute.Integer & Attribute.DefaultTo<0>;
    volume_24h: Attribute.Float & Attribute.DefaultTo<0>;
    volume_7d: Attribute.Float & Attribute.DefaultTo<0>;
    change_24h: Attribute.Float;
    token_type: Attribute.String;
    royalty_fee_point: Attribute.Integer & Attribute.DefaultTo<0>;
    royalty_fee_receiver: Attribute.String;
    protocol_fee_receiver: Attribute.String;
    protocol_fee_point: Attribute.Integer & Attribute.DefaultTo<0>;
    volume_total: Attribute.Float & Attribute.DefaultTo<0>;
    floor_price: Attribute.Float & Attribute.DefaultTo<0>;
    sale_24h: Attribute.Integer & Attribute.DefaultTo<0>;
    airdrop_multiplier: Attribute.Decimal & Attribute.DefaultTo<1>;
    change_7d: Attribute.Float;
    creator_address: Attribute.String;
    best_offer: Attribute.Float & Attribute.DefaultTo<0>;
    is_launchpad: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::collection.collection',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::collection.collection',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCollectionStatLogCollectionStatLog
  extends Schema.CollectionType {
  collectionName: 'collection_stat_logs';
  info: {
    singularName: 'collection-stat-log';
    pluralName: 'collection-stat-logs';
    displayName: 'CollectionStatLog';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    floor_price_1h: Attribute.Float;
    volume_1h: Attribute.Float;
    collection: Attribute.Relation<
      'api::collection-stat-log.collection-stat-log',
      'manyToOne',
      'api::collection.collection'
    >;
    timestamp: Attribute.BigInteger;
    sale_1h: Attribute.Integer & Attribute.DefaultTo<0>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::collection-stat-log.collection-stat-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::collection-stat-log.collection-stat-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEarlyUserEarlyUser extends Schema.CollectionType {
  collectionName: 'early_users';
  info: {
    singularName: 'early-user';
    pluralName: 'early-users';
    displayName: 'Early User';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    wallet: Attribute.String & Attribute.Required & Attribute.Unique;
    twitter_id: Attribute.String & Attribute.Required;
    twitter_name: Attribute.String;
    twitter_profile_image: Attribute.String;
    discord_id: Attribute.String & Attribute.Required;
    own_code: Attribute.String & Attribute.Required & Attribute.Unique;
    ref_code: Attribute.String;
    guests: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<0>;
    eth_deposited: Attribute.Float &
      Attribute.Required &
      Attribute.DefaultTo<0>;
    usd_deposited: Attribute.Float &
      Attribute.Required &
      Attribute.DefaultTo<0>;
    bonus: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<0>;
    community_incentive: Attribute.Integer & Attribute.DefaultTo<0>;
    invite_point: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<0>;
    is_wl: Attribute.Boolean & Attribute.DefaultTo<false>;
    bridging_eth: Attribute.Float & Attribute.DefaultTo<0>;
    bridging_dai: Attribute.Float & Attribute.DefaultTo<0>;
    is_main_wl: Attribute.Boolean & Attribute.DefaultTo<false>;
    total_invite_point: Attribute.Integer & Attribute.DefaultTo<0>;
    bridging_point: Attribute.BigInteger & Attribute.DefaultTo<'0'>;
    isFinalized: Attribute.Boolean & Attribute.DefaultTo<false>;
    isValidWallet: Attribute.Boolean;
    isValidDiscord: Attribute.Boolean & Attribute.DefaultTo<true>;
    isValidTwitter: Attribute.Boolean & Attribute.DefaultTo<true>;
    is_suspended: Attribute.Boolean & Attribute.DefaultTo<false>;
    blur_point: Attribute.Float & Attribute.DefaultTo<0>;
    is_og: Attribute.Boolean & Attribute.DefaultTo<false>;
    pre_token: Attribute.Float & Attribute.DefaultTo<0>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::early-user.early-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::early-user.early-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiErrorLogErrorLog extends Schema.CollectionType {
  collectionName: 'error_logs';
  info: {
    singularName: 'error-log';
    pluralName: 'error-logs';
    displayName: 'ErrorLog';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    error_detail: Attribute.Text;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::error-log.error-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::error-log.error-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiExchangeUserExchangeUser extends Schema.CollectionType {
  collectionName: 'exchange_users';
  info: {
    singularName: 'exchange-user';
    pluralName: 'exchange-users';
    displayName: 'ExchangeUser';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Attribute.String & Attribute.Unique;
    maker_nonce: Attribute.Integer & Attribute.DefaultTo<0>;
    hash_nonce: Attribute.Integer & Attribute.DefaultTo<0>;
    request_logs: Attribute.Relation<
      'api::exchange-user.exchange-user',
      'oneToMany',
      'api::request-log.request-log'
    >;
    signature: Attribute.String;
    username: Attribute.String;
    icon_url: Attribute.String;
    at_last_login: Attribute.DateTime;
    early_user: Attribute.Relation<
      'api::exchange-user.exchange-user',
      'oneToOne',
      'api::early-user.early-user'
    >;
    total_airdrop_point: Attribute.Float & Attribute.DefaultTo<0>;
    airdrop_multiplier: Attribute.Float;
    box_unrevealed: Attribute.Integer & Attribute.DefaultTo<0>;
    box_explorer: Attribute.Integer & Attribute.DefaultTo<0>;
    box_gurdian: Attribute.Integer & Attribute.DefaultTo<0>;
    box_epic: Attribute.Integer & Attribute.DefaultTo<0>;
    box_legendary: Attribute.Integer & Attribute.DefaultTo<0>;
    total_bridging_point: Attribute.Float & Attribute.DefaultTo<0>;
    total_extra_point: Attribute.Float;
    total_sale_point: Attribute.Float;
    total_bidding_point: Attribute.Float;
    total_listing_point: Attribute.Float;
    weneth_balance: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::exchange-user.exchange-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::exchange-user.exchange-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFeaturedItemFeaturedItem extends Schema.CollectionType {
  collectionName: 'featured_items';
  info: {
    singularName: 'featured-item';
    pluralName: 'featured-items';
    displayName: 'FeaturedItem';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    collection: Attribute.Relation<
      'api::featured-item.featured-item',
      'oneToOne',
      'api::collection.collection'
    >;
    name: Attribute.String;
    description: Attribute.String;
    icon: Attribute.Media;
    banner: Attribute.Media;
    link: Attribute.String;
    order: Attribute.Integer & Attribute.DefaultTo<100>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::featured-item.featured-item',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::featured-item.featured-item',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNftNft extends Schema.CollectionType {
  collectionName: 'nfts';
  info: {
    singularName: 'nft';
    pluralName: 'nfts';
    displayName: 'NFT';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    collection: Attribute.Relation<
      'api::nft.nft',
      'manyToOne',
      'api::collection.collection'
    >;
    name: Attribute.String & Attribute.Required;
    image_url: Attribute.Text & Attribute.Required;
    token_id: Attribute.BigInteger & Attribute.Required;
    rarity_score: Attribute.Float & Attribute.DefaultTo<0>;
    rarity_rank: Attribute.Integer;
    owner: Attribute.String & Attribute.Required;
    top_offer_price: Attribute.Float;
    traits: Attribute.JSON;
    orders: Attribute.Relation<'api::nft.nft', 'oneToMany', 'api::order.order'>;
    sell_order: Attribute.Relation<
      'api::nft.nft',
      'oneToOne',
      'api::order.order'
    >;
    last_sale_price: Attribute.Float;
    buy_orders: Attribute.Relation<
      'api::nft.nft',
      'oneToMany',
      'api::buy-order.buy-order'
    >;
    is_valid_metadata: Attribute.Boolean & Attribute.DefaultTo<true>;
    try_count: Attribute.Integer & Attribute.DefaultTo<1>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::nft.nft', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::nft.nft', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiNftTradeLogNftTradeLog extends Schema.CollectionType {
  collectionName: 'nft_trade_logs';
  info: {
    singularName: 'nft-trade-log';
    pluralName: 'nft-trade-logs';
    displayName: 'NFTTradeLog';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    type: Attribute.String & Attribute.Required;
    from: Attribute.String & Attribute.Required;
    to: Attribute.String;
    price: Attribute.Float;
    expired_at: Attribute.DateTime;
    nft: Attribute.Relation<
      'api::nft-trade-log.nft-trade-log',
      'oneToOne',
      'api::nft.nft'
    >;
    tx_hash: Attribute.String;
    timestamp: Attribute.BigInteger;
    ex_type: Attribute.String;
    sale_type: Attribute.String;
    payment_token: Attribute.Relation<
      'api::nft-trade-log.nft-trade-log',
      'oneToOne',
      'api::token.token'
    >;
    buy_order_hash: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::nft-trade-log.nft-trade-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::nft-trade-log.nft-trade-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiOrderOrder extends Schema.CollectionType {
  collectionName: 'orders';
  info: {
    singularName: 'order';
    pluralName: 'orders';
    displayName: 'Order';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    order_id: Attribute.String;
    schema: Attribute.String;
    token_id: Attribute.BigInteger;
    quantity: Attribute.Integer;
    order_hash: Attribute.String;
    collection: Attribute.Relation<
      'api::order.order',
      'oneToOne',
      'api::collection.collection'
    >;
    is_valid: Attribute.Boolean & Attribute.DefaultTo<true>;
    contract_address: Attribute.String;
    sale_kind: Attribute.Integer;
    side: Attribute.Integer;
    maker: Attribute.String;
    taker: Attribute.String;
    expiration_time: Attribute.String;
    listing_time: Attribute.String;
    standard: Attribute.String & Attribute.DefaultTo<'wen-ex-v1'>;
    nft: Attribute.Relation<'api::order.order', 'manyToOne', 'api::nft.nft'>;
    nonce: Attribute.BigInteger;
    price: Attribute.String;
    price_eth: Attribute.Float;
    token: Attribute.Relation<
      'api::order.order',
      'oneToOne',
      'api::token.token'
    >;
    exchange_data: Attribute.Text;
    protocol_fee_receiver: Attribute.String;
    royalty_fee_receiver: Attribute.String;
    protocol_fee_point: Attribute.Integer;
    royalty_fee_point: Attribute.Integer;
    hash_nonce: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::order.order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::order.order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiRequestLogRequestLog extends Schema.CollectionType {
  collectionName: 'request_logs';
  info: {
    singularName: 'request-log';
    pluralName: 'request-logs';
    displayName: 'RequestLog';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    request_uuid: Attribute.String & Attribute.Required;
    type: Attribute.String & Attribute.Required;
    exchange_user: Attribute.Relation<
      'api::request-log.request-log',
      'manyToOne',
      'api::exchange-user.exchange-user'
    >;
    original_nonce: Attribute.Integer;
    new_nonce: Attribute.Integer;
    post_batch_data: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::request-log.request-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::request-log.request-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTokenToken extends Schema.CollectionType {
  collectionName: 'tokens';
  info: {
    singularName: 'token';
    pluralName: 'tokens';
    displayName: 'Token';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    symbol: Attribute.String;
    decimal: Attribute.Integer;
    icon: Attribute.String;
    address: Attribute.String;
    token_id: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::token.token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::token.token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWenEthBalanceChangeLogWenEthBalanceChangeLog
  extends Schema.CollectionType {
  collectionName: 'wen_eth_balance_change_logs';
  info: {
    singularName: 'wen-eth-balance-change-log';
    pluralName: 'wen-eth-balance-change-logs';
    displayName: 'WenETH Balance Change Log';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    from: Attribute.String;
    to: Attribute.String;
    amount: Attribute.String;
    type: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::wen-eth-balance-change-log.wen-eth-balance-change-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::wen-eth-balance-change-log.wen-eth-balance-change-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWenOgPassStatWenOgPassStat extends Schema.CollectionType {
  collectionName: 'wen_og_pass_stats';
  info: {
    singularName: 'wen-og-pass-stat';
    pluralName: 'wen-og-pass-stats';
    displayName: 'WenOgPassStat';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    total_staked: Attribute.BigInteger;
    yield_in_weneth: Attribute.Float;
    yield_in_eth: Attribute.Float;
    floor_price: Attribute.Float;
    timestamp: Attribute.BigInteger;
    error_log: Attribute.Text;
    eth_to_team_wallet: Attribute.Float;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::wen-og-pass-stat.wen-og-pass-stat',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::wen-og-pass-stat.wen-og-pass-stat',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWenTradePoolStatWenTradePoolStat
  extends Schema.CollectionType {
  collectionName: 'wen_trade_pool_stats';
  info: {
    singularName: 'wen-trade-pool-stat';
    pluralName: 'wen-trade-pool-stats';
    displayName: 'WenTradePoolStat';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    timestamp: Attribute.BigInteger;
    pool_balance: Attribute.Float;
    yield_in_eth: Attribute.Float;
    error_log: Attribute.Text;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::wen-trade-pool-stat.wen-trade-pool-stat',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::wen-trade-pool-stat.wen-trade-pool-stat',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'plugin::i18n.locale': PluginI18NLocale;
      'api::airdrop-distribution-stat.airdrop-distribution-stat': ApiAirdropDistributionStatAirdropDistributionStat;
      'api::airdrop-history-log.airdrop-history-log': ApiAirdropHistoryLogAirdropHistoryLog;
      'api::airdrop-stat-log.airdrop-stat-log': ApiAirdropStatLogAirdropStatLog;
      'api::batch-buy-order.batch-buy-order': ApiBatchBuyOrderBatchBuyOrder;
      'api::buy-order.buy-order': ApiBuyOrderBuyOrder;
      'api::coin-price.coin-price': ApiCoinPriceCoinPrice;
      'api::collection.collection': ApiCollectionCollection;
      'api::collection-stat-log.collection-stat-log': ApiCollectionStatLogCollectionStatLog;
      'api::early-user.early-user': ApiEarlyUserEarlyUser;
      'api::error-log.error-log': ApiErrorLogErrorLog;
      'api::exchange-user.exchange-user': ApiExchangeUserExchangeUser;
      'api::featured-item.featured-item': ApiFeaturedItemFeaturedItem;
      'api::nft.nft': ApiNftNft;
      'api::nft-trade-log.nft-trade-log': ApiNftTradeLogNftTradeLog;
      'api::order.order': ApiOrderOrder;
      'api::request-log.request-log': ApiRequestLogRequestLog;
      'api::token.token': ApiTokenToken;
      'api::wen-eth-balance-change-log.wen-eth-balance-change-log': ApiWenEthBalanceChangeLogWenEthBalanceChangeLog;
      'api::wen-og-pass-stat.wen-og-pass-stat': ApiWenOgPassStatWenOgPassStat;
      'api::wen-trade-pool-stat.wen-trade-pool-stat': ApiWenTradePoolStatWenTradePoolStat;
    }
  }
}
